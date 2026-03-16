import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { authService } from "../services/authService";
import { setCredentials } from "../store/store";

interface LoginForm {
  email: string;
  password: string;
}

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError("");
      const res = await authService.login(data.email, data.password);
      dispatch(setCredentials({ user: res.user, token: res.token }));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow">
        
        <h2 className="text-2xl font-bold text-center">Sign in</h2>

        <p className="text-center text-sm mt-2">
          <Link to="/register" className="text-indigo-600">
            Create new account
          </Link>
        </p>

        {error && (
          <p className="text-red-600 text-sm text-center mt-3">{error}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">

          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="w-full border p-2 rounded"
            />
            {errors.email && (
              <p className="text-red-600 text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register("password")}
              className="w-full border p-2 rounded pr-10"
            />

            {/* Eye Icon */}
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2 cursor-pointer text-gray-500"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>

            {errors.password && (
              <p className="text-red-600 text-xs">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center text-sm">
            <input type="checkbox" className="mr-2" />
            Remember me
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white p-2 rounded"
          >
            {isSubmitting ? "Logging in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;