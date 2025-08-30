import TaskManagePage from "./pages/TaskManagePage";
import { Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TaskManagePage />} />
      <Route path="/tasks" element={<TaskManagePage />} />
      <Route path="/tasks/:taskId" element={<TaskManagePage />} />
      <Route path="/attempts/new" element={<TaskManagePage />} />
      <Route path="/settings" element={<TaskManagePage />} />
      <Route path="/agent" element={<TaskManagePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
