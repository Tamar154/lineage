import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import TreesPage from "./pages/TreesPage";
import TreePage from "./pages/TreePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/trees" element={<TreesPage />} />
        <Route path="/trees/:treeId" element={<TreePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
