import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForgotPassword } from "@/api/auth";
import { emailOnlySchema, type EmailOnlyValues } from "@/lib/schemas";
import { toastError } from "@/lib/api";

export default function ForgotPassword() {
  const fp = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<EmailOnlyValues>({ resolver: zodResolver(emailOnlySchema), defaultValues: { email: "" } });

  const onSubmit = async (vals: EmailOnlyValues) => {
    try {
      await fp.mutateAsync(vals);
      toast.success("If the email exists, a reset link was sent.");
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>We'll email you a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={fp.isPending}>
            {fp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
          {isSubmitSuccessful && (
            <p className="text-sm text-center text-muted-foreground">Check your inbox.</p>
          )}
          <p className="text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
