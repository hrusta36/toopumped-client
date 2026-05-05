import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WorkoutPlanner from "./pages/WorkoutPlanner";
import CalorieTracker from "./pages/CalorieTracker";
import Competitions from "./pages/Competitions";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import WorkoutLibrary from "./pages/WorkoutLibrary";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="workout" element={<WorkoutPlanner />} />
            <Route path="workout-library" element={<WorkoutLibrary />} />
            <Route path="calories" element={<CalorieTracker />} />
            <Route path="competitions" element={<Competitions />} />
            <Route path="friends" element={<Friends />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<Admin/>}/>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
