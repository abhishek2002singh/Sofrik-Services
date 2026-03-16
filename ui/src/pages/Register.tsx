import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { authService } from "../services/authService";
import { setCredentials } from "../store/store";

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/,
      "Password must contain letter, number and special character"
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError("");
      const res = await authService.register(data.email, data.password);
      dispatch(setCredentials({ user: res.user, token: res.token }));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const password = watch("password");

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (/[A-Za-z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[@$!%*#?&]/.test(pwd)) strength++;
    return strength;
  };

  const strength = password ? getPasswordStrength(password) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-center">Create account</h2>

        <p className="text-sm text-center mt-2">
          <Link to="/login" className="text-indigo-600">
            Already have an account?
          </Link>
        </p>

        {error && (
          <p className="text-red-600 text-sm text-center mt-3">{error}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            className="w-full border p-2 rounded"
          />
          {errors.email && (
            <p className="text-red-600 text-xs">{errors.email.message}</p>
          )}

          <input
            type="password"
            placeholder="Password"
            {...register("password")}
            className="w-full border p-2 rounded"
          />
          {errors.password && (
            <p className="text-red-600 text-xs">{errors.password.message}</p>
          )}

          {password && (
            <p className="text-xs text-gray-500">
              Strength: {["Weak", "Fair", "Good", "Strong"][strength - 1] || "Weak"}
            </p>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword")}
            className="w-full border p-2 rounded"
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-xs">
              {errors.confirmPassword.message}
            </p>
          )}

          <div className="flex items-center text-sm">
            <input type="checkbox" required className="mr-2" />
            I agree to Terms
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white p-2 rounded"
          >
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;