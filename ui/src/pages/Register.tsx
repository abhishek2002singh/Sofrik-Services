import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Mail, Lock, UserPlus, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { authService } from "../services/authService";
import { setCredentials } from "../store/store";

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
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
  terms: yup.boolean().oneOf([true], "You must accept the terms").required(),
});

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      terms: false
    }
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
  const confirmPassword = watch("confirmPassword");

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    const checks = {
      length: pwd.length >= 6,
      letter: /[A-Za-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[@$!%*#?&]/.test(pwd)
    };
    
    strength = Object.values(checks).filter(Boolean).length;
    return { strength, checks };
  };

  const { strength, checks } = password ? getPasswordStrength(password) : { strength: 0, checks: {} as any };

  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
          {/* Header with decorative element */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h2 className="text-3xl font-bold text-white">Create Account</h2>
            <p className="text-indigo-100 mt-2">Join us and start your journey</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                <XCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    {...register("password")}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < strength ? strengthColors[strength - 1] : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Strength: <span className="font-medium">{strengthLabels[strength - 1] || "Very Weak"}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs">
                      {checks.length ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-gray-300" />}
                      <span className={checks.length ? "text-green-600" : "text-gray-400"}>6+ characters</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {checks.letter ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-gray-300" />}
                      <span className={checks.letter ? "text-green-600" : "text-gray-400"}>Contains letter</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {checks.number ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-gray-300" />}
                      <span className={checks.number ? "text-green-600" : "text-gray-400"}>Contains number</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {checks.special ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-gray-300" />}
                      <span className={checks.special ? "text-green-600" : "text-gray-400"}>Special character</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${
                      errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
                {confirmPassword && password === confirmPassword && password !== "" && (
                  <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} /> Passwords match
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    {...register("terms")}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                </div>
                <label className="ml-2 text-sm text-gray-600">
                  I agree to the{" "}
                  <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600">{errors.terms.message}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;