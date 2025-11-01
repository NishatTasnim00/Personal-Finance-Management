import AuthLayout from "@/components/Layout/AuthLayout";
import LoginForm from "@/components/Auth/LoginForm";

const Login = () => {
  return (
    <AuthLayout title="Welcome back!">
      <LoginForm />
    </AuthLayout>
  );
};
export default Login;