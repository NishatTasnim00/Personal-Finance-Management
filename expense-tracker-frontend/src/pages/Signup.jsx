import AuthLayout from "@/components/layout/AuthLayout";
import SignupForm from "@/components/auth/SignupForm";

const Signup = () => {
  return (
    <AuthLayout title="Create your account">
      <SignupForm />
    </AuthLayout>
  );
};
export default Signup;  