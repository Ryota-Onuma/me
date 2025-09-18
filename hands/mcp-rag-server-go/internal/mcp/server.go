package mcp

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"sync"
)

type ToolHandler func(args map[string]interface{}) ([]ToolContent, error)

type Server struct {
	name        string
	version     string
	description string
	tools       map[string]Tool
	handlers    map[string]ToolHandler
	logger      *log.Logger
	mu          sync.RWMutex
}

func NewServer(name, version, description string) *Server {
	return &Server{
		name:        name,
		version:     version,
		description: description,
		tools:       make(map[string]Tool),
		handlers:    make(map[string]ToolHandler),
		logger:      log.New(os.Stderr, "[MCP] ", log.LstdFlags),
	}
}

func (s *Server) RegisterTool(tool Tool, handler ToolHandler) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.tools[tool.Name] = tool
	s.handlers[tool.Name] = handler
	s.logger.Printf("ツールを登録しました: %s", tool.Name)
}

func (s *Server) Start() error {
	s.logger.Printf("%s %s を起動しています...", s.name, s.version)

	scanner := bufio.NewScanner(os.Stdin)
	encoder := json.NewEncoder(os.Stdout)

	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		response := s.handleRequest(line)
		if response != nil {
			if err := encoder.Encode(response); err != nil {
				s.logger.Printf("レスポンスの送信に失敗: %v", err)
				return err
			}
			os.Stdout.Write([]byte("\n"))
		}
	}

	if err := scanner.Err(); err != nil && err != io.EOF {
		s.logger.Printf("入力の読み取りエラー: %v", err)
		return err
	}

	return nil
}

func (s *Server) handleRequest(data []byte) *JSONRPCResponse {
	var req JSONRPCRequest
	if err := json.Unmarshal(data, &req); err != nil {
		s.logger.Printf("JSON解析エラー: %v", err)
		return &JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      nil,
			Error: &JSONRPCError{
				Code:    ErrorCodeParseError,
				Message: "Parse error",
				Data:    err.Error(),
			},
		}
	}

	s.logger.Printf("リクエスト受信: %s", req.Method)

	switch req.Method {
	case "initialize":
		return s.handleInitialize(req)
	case "tools/list":
		return s.handleToolsList(req)
	case "tools/call":
		return s.handleToolsCall(req)
	default:
		return &JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error: &JSONRPCError{
				Code:    ErrorCodeMethodNotFound,
				Message: "Method not found",
				Data:    req.Method,
			},
		}
	}
}

func (s *Server) handleInitialize(req JSONRPCRequest) *JSONRPCResponse {
	var initReq InitializeRequest
	if err := json.Unmarshal(req.Params, &initReq); err != nil {
		return &JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error: &JSONRPCError{
				Code:    ErrorCodeInvalidParams,
				Message: "Invalid params",
				Data:    err.Error(),
			},
		}
	}

	s.logger.Printf("クライアント情報: %s %s", initReq.ClientInfo.Name, initReq.ClientInfo.Version)

	response := InitializeResponse{
		ProtocolVersion: "2024-11-05",
		Capabilities: ServerCapabilities{
			Tools: map[string]interface{}{},
		},
		ServerInfo: ServerInfo{
			Name:    s.name,
			Version: s.version,
		},
	}

	return &JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  response,
	}
}

func (s *Server) handleToolsList(req JSONRPCRequest) *JSONRPCResponse {
	s.mu.RLock()
	tools := make([]Tool, 0, len(s.tools))
	for _, tool := range s.tools {
		tools = append(tools, tool)
	}
	s.mu.RUnlock()

	response := ToolsListResponse{
		Tools: tools,
	}

	return &JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  response,
	}
}

func (s *Server) handleToolsCall(req JSONRPCRequest) *JSONRPCResponse {
	var toolReq ToolsCallRequest
	if err := json.Unmarshal(req.Params, &toolReq); err != nil {
		return &JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error: &JSONRPCError{
				Code:    ErrorCodeInvalidParams,
				Message: "Invalid params",
				Data:    err.Error(),
			},
		}
	}

	s.mu.RLock()
	handler, exists := s.handlers[toolReq.Name]
	s.mu.RUnlock()

	if !exists {
		return &JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error: &JSONRPCError{
				Code:    ErrorCodeInvalidTool,
				Message: "Tool not found",
				Data:    toolReq.Name,
			},
		}
	}

	s.logger.Printf("ツール実行: %s", toolReq.Name)

	content, err := handler(toolReq.Arguments)
	if err != nil {
		s.logger.Printf("ツール実行エラー: %v", err)
		return &JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result: ToolsCallResponse{
				Content: []ToolContent{
					{
						Type: "text",
						Text: fmt.Sprintf("エラー: %v", err),
					},
				},
				IsError: true,
			},
		}
	}

	response := ToolsCallResponse{
		Content: content,
		IsError: false,
	}

	return &JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  response,
	}
}