#!/usr/bin/env bash
set -euo pipefail

# Enhanced dev orchestrator with process group management and failure handling
# Usage: scripts/dev.sh [--open] [--no-force-kill-ports]
# Note: デフォルトで競合ポートを自動的にkillします。無効化は --no-force-kill-ports。

# Configuration (env override possible)
BACKEND_PORT="${BACKEND_PORT:-8888}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"  
BACKEND_HEALTH_PATH="/health"
STARTUP_TIMEOUT=30
HEALTH_CHECK_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
OPEN_BROWSER=0
FORCE_KILL_PORTS=1
BACKEND_PID=""
FRONTEND_PID=""
BACKEND_PGID=""
FRONTEND_PGID=""
LOG_BACKEND_PID=""
LOG_FRONTEND_PID=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --open) OPEN_BROWSER=1 ;;
    --force-kill-ports) FORCE_KILL_PORTS=1 ;;
    --no-force-kill-ports) FORCE_KILL_PORTS=0 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_backend() { echo -e "${BLUE}[BACKEND]${NC} $1"; }
log_frontend() { echo -e "${PURPLE}[FRONTEND]${NC} $1"; }

# Check required dependencies
check_dependencies() {
  local missing=()
  for cmd in go npm curl; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      missing+=("$cmd")
    fi
  done
  
  if [[ ${#missing[@]} -gt 0 ]]; then
    log_error "Missing required commands: ${missing[*]}"
    log_error "Please install them and try again."
    exit 1
  fi
  log_info "All dependencies found: go, npm, curl"
}

# Check if port is in use
check_port() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti:$port >/dev/null 2>&1
  elif command -v netstat >/dev/null 2>&1; then
    netstat -tuln 2>/dev/null | grep -q ":$port "
  elif command -v ss >/dev/null 2>&1; then
    ss -tuln 2>/dev/null | grep -q ":$port "
  else
    log_warn "Cannot check port usage (no lsof/netstat/ss available)"
    return 1
  fi
}

# Kill processes using a port
kill_port_process() {
  local port=$1
  local pids
  
  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -ti:$port 2>/dev/null || true)
  else
    log_warn "Cannot kill processes on port $port (lsof not available)"
    return 1
  fi
  
  if [[ -n "$pids" ]]; then
    log_warn "Killing existing processes on port $port: $pids"
    kill $pids 2>/dev/null || true
    sleep 2
    
    # Force kill if still running
    if check_port $port; then
      log_warn "Force killing processes on port $port"
      kill -9 $pids 2>/dev/null || true
      sleep 1
    fi
  fi
}

# Handle port conflicts
handle_port_conflicts() {
  local conflicts=()
  
  if check_port $BACKEND_PORT; then
    conflicts+=("backend:$BACKEND_PORT")
  fi
  
  if check_port $FRONTEND_PORT; then
    conflicts+=("frontend:$FRONTEND_PORT")
  fi
  
  if [[ ${#conflicts[@]} -gt 0 ]]; then
    log_warn "Port conflicts detected: ${conflicts[*]}"
    
    if [[ $FORCE_KILL_PORTS -eq 1 ]]; then
      log_info "Force killing processes on conflicting ports..."
      check_port $BACKEND_PORT && kill_port_process $BACKEND_PORT
      check_port $FRONTEND_PORT && kill_port_process $FRONTEND_PORT
    else
      log_error "Ports in use. Use --force-kill-ports to automatically kill conflicting processes."
      log_info "Or manually stop services on ports: ${conflicts[*]}"
      exit 1
    fi
  fi
}

# Setup logging with process identification
setup_logging() {
  # Create named pipes for process-specific logging
  mkfifo "$ROOT_DIR/.backend.pipe" "$ROOT_DIR/.frontend.pipe" 2>/dev/null || true
  
  # Start log processors in background
  while IFS= read -r line; do
    log_backend "$line"
  done < "$ROOT_DIR/.backend.pipe" &
  LOG_BACKEND_PID=$!
  
  while IFS= read -r line; do
    log_frontend "$line"  
  done < "$ROOT_DIR/.frontend.pipe" &
  LOG_FRONTEND_PID=$!
}

# Start backend service
start_backend() {
  log_info "Starting backend on port $BACKEND_PORT..."
  cd "$ROOT_DIR/backend"
  
  # Start process; prefer new process group via setsid if available
  if command -v setsid >/dev/null 2>&1; then
    setsid bash -c "GOCACHE='$ROOT_DIR/backend/.gocache' go run . 2>&1" \
      > "$ROOT_DIR/.backend.pipe" 2>&1 &
  else
    bash -c "GOCACHE='$ROOT_DIR/backend/.gocache' go run . 2>&1" \
      > "$ROOT_DIR/.backend.pipe" 2>&1 &
  fi
  BACKEND_PID=$!
  
  # Get process group ID
  sleep 0.5 # Give process time to start
  if kill -0 $BACKEND_PID 2>/dev/null; then
    BACKEND_PGID=$(ps -o pgid= $BACKEND_PID 2>/dev/null | tr -d ' ' || echo "")
    log_info "Backend started with PID $BACKEND_PID, PGID ${BACKEND_PGID:-N/A}"
  else
    log_error "Backend failed to start"
    return 1
  fi
}

# Start frontend service  
start_frontend() {
  log_info "Starting frontend on port $FRONTEND_PORT..."
  cd "$ROOT_DIR/frontend"
  
  # Start process; prefer new process group via setsid if available
  if command -v setsid >/dev/null 2>&1; then
    setsid npm run dev -- --port "$FRONTEND_PORT" \
      > "$ROOT_DIR/.frontend.pipe" 2>&1 &
  else
    npm run dev -- --port "$FRONTEND_PORT" \
      > "$ROOT_DIR/.frontend.pipe" 2>&1 &
  fi
  FRONTEND_PID=$!
  
  # Get process group ID
  sleep 0.5 # Give process time to start
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    FRONTEND_PGID=$(ps -o pgid= $FRONTEND_PID 2>/dev/null | tr -d ' ' || echo "")
    log_info "Frontend started with PID $FRONTEND_PID, PGID ${FRONTEND_PGID:-N/A}"
  else
    log_error "Frontend failed to start"
    return 1
  fi
}

# Wait for service to be healthy
wait_for_service() {
  local name=$1
  local url=$2
  local timeout=$3
  local count=0
  
  log_info "Waiting for $name to be ready at $url..."
  
  while [[ $count -lt $timeout ]]; do
    if curl -sSf "$url" >/dev/null 2>&1; then
      log_info "$name is ready! ✅"
      return 0
    fi
    
    # Check if process is still running
    local pid=""
    if [[ "$name" == "Backend" && -n "$BACKEND_PID" ]]; then
      pid=$BACKEND_PID
    elif [[ "$name" == "Frontend" && -n "$FRONTEND_PID" ]]; then
      pid=$FRONTEND_PID
    fi
    
    if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then
      log_error "$name process died during startup"
      return 1
    fi
    
    sleep 1
    ((count++))
    
    # Show progress every 5 seconds
    if [[ $((count % 5)) -eq 0 ]]; then
      log_info "Still waiting for $name... ($count/${timeout}s)"
    fi
  done
  
  log_error "$name failed to start within $timeout seconds"
  return 1
}

# Monitor services health
monitor_services() {
  while true; do
    sleep $HEALTH_CHECK_INTERVAL
    
    # Check if processes are still running
    local backend_running=false
    local frontend_running=false
    
    if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
      backend_running=true
    fi
    
    if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
      frontend_running=true  
    fi
    
    if [[ "$backend_running" == false ]]; then
      log_error "Backend process died unexpectedly!"
      cleanup
      exit 1
    fi
    
    if [[ "$frontend_running" == false ]]; then
      log_error "Frontend process died unexpectedly!"
      cleanup  
      exit 1
    fi
  done
}

# Comprehensive cleanup function
cleanup() {
  log_info "Shutting down services..."
  
  # Kill process groups (preferred method)
  if [[ -n "${BACKEND_PGID:-}" ]] && [[ "$BACKEND_PGID" != "" ]]; then
    log_info "Stopping backend process group $BACKEND_PGID"
    kill -TERM -$BACKEND_PGID 2>/dev/null || true
  fi
  
  if [[ -n "${FRONTEND_PGID:-}" ]] && [[ "$FRONTEND_PGID" != "" ]]; then
    log_info "Stopping frontend process group $FRONTEND_PGID"
    kill -TERM -$FRONTEND_PGID 2>/dev/null || true
  fi
  
  # Fallback: recursively kill descendants by parent PID
  kill_descendants() {
    local parent=$1
    local kids
    kids=$(pgrep -P "$parent" 2>/dev/null || true)
    for k in $kids; do
      kill_descendants "$k"
      kill -TERM "$k" 2>/dev/null || true
    done
  }

  # Fallback: kill individual processes
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill_descendants "$BACKEND_PID"
    kill -TERM $BACKEND_PID 2>/dev/null || true
  fi
  
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill_descendants "$FRONTEND_PID"
    kill -TERM $FRONTEND_PID 2>/dev/null || true
  fi
  
  # Wait for graceful shutdown
  sleep 3
  
  # Force kill if necessary
  if [[ -n "${BACKEND_PGID:-}" ]] && [[ "$BACKEND_PGID" != "" ]]; then
    kill -KILL -$BACKEND_PGID 2>/dev/null || true
  fi
  
  if [[ -n "${FRONTEND_PGID:-}" ]] && [[ "$FRONTEND_PGID" != "" ]]; then
    kill -KILL -$FRONTEND_PGID 2>/dev/null || true
  fi
  
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill -KILL $BACKEND_PID 2>/dev/null || true
  fi
  
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill -KILL $FRONTEND_PID 2>/dev/null || true
  fi

  # Ensure ports are freed as last resort
  check_port $BACKEND_PORT && kill_port_process $BACKEND_PORT
  check_port $FRONTEND_PORT && kill_port_process $FRONTEND_PORT
  
  # Clean up log processors
  if [[ -n "${LOG_BACKEND_PID:-}" ]]; then
    kill $LOG_BACKEND_PID 2>/dev/null || true
  fi
  
  if [[ -n "${LOG_FRONTEND_PID:-}" ]]; then
    kill $LOG_FRONTEND_PID 2>/dev/null || true
  fi
  
  # Remove named pipes and temp files
  rm -f "$ROOT_DIR/.backend.pipe" "$ROOT_DIR/.frontend.pipe"
  
  log_info "Cleanup completed"
}

# Setup signal handlers
trap cleanup INT TERM EXIT

# Main execution
main() {
  log_info "🚀 Starting enhanced development environment..."
  
  # Pre-flight checks
  check_dependencies
  handle_port_conflicts
  
  # Export ports so child processes (Vite/Go) can read them
  export BACKEND_PORT FRONTEND_PORT
  export PORT="$BACKEND_PORT"
  
  # Setup logging infrastructure
  setup_logging
  
  # Start services
  if ! start_backend; then
    log_error "Failed to start backend"
    cleanup
    exit 1
  fi
  
  if ! start_frontend; then
    log_error "Failed to start frontend"  
    cleanup
    exit 1
  fi
  
  # Wait for services to be ready
  if ! wait_for_service "Backend" "http://localhost:$BACKEND_PORT$BACKEND_HEALTH_PATH" $STARTUP_TIMEOUT; then
    log_error "Backend health check failed, trying basic connectivity..."
    if ! wait_for_service "Backend" "http://localhost:$BACKEND_PORT" 10; then
      log_error "Backend startup failed completely"
      cleanup
      exit 1  
    fi
    log_warn "Backend responding but health check endpoint may not exist"
  fi
  
  if ! wait_for_service "Frontend" "http://localhost:$FRONTEND_PORT" $STARTUP_TIMEOUT; then
    log_error "Frontend startup failed"
    cleanup
    exit 1
  fi
  
  # Open browser if requested
  if [[ $OPEN_BROWSER -eq 1 ]]; then
    local url="http://localhost:$FRONTEND_PORT"
    log_info "Opening browser: $url"
    
    if command -v open >/dev/null 2>&1; then
      open "$url"
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$url"  
    elif command -v start >/dev/null 2>&1; then
      start "$url"
    else
      log_warn "Cannot open browser automatically. Please visit: $url"
    fi
  fi
  
  log_info "🎉 Development environment ready!"
  log_info "Backend:  http://localhost:$BACKEND_PORT"
  log_info "Frontend: http://localhost:$FRONTEND_PORT"
  log_info ""
  log_info "Press Ctrl+C to stop all services"
  
  # Start health monitoring in background
  monitor_services &
  
  # Wait for termination
  wait
}

# Execute main function
main
