import "./Login.css";
import AuthLayout from "../layouts/AuthLayout";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";

function Login() {
  return (
    <AuthLayout>
      <div className="login-card">
      <Logo />

      <h2>Login</h2>

      <InputField
        type="email"
        placeholder="Enter your email"
      />

      <InputField
        type="password"
        placeholder="Enter your password"
      />

      <PrimaryButton text="Login" />

      <p className="forgot-link">Forgot Password?</p>

      <p className="register-link">Create a New Account</p>
    </div>
    </AuthLayout>
  );
}

export default Login;