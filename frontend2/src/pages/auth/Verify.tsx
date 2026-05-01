import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVerify } from "@/api/auth";
import { extractError } from "@/lib/api";

export default function Verify() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const verify = useVerify();
  const [state, setState] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMsg("Missing verification token.");
      return;
    }
    verify
      .mutateAsync({ token })
      .then(() => setState("ok"))
      .catch((e) => {
        setState("error");
        setMsg(extractError(e, "Verification failed"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Email verification</CardTitle>
        <CardDescription>We're verifying your email address.</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {state === "idle" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p>Verifying...</p>
          </div>
        )}
        {state === "ok" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p>Email verified successfully!</p>
            <Button asChild>
              <Link to="/login">Continue to login</Link>
            </Button>
          </div>
        )}
        {state === "error" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm text-muted-foreground">{msg}</p>
            <Button asChild variant="outline">
              <Link to="/login">Back to login</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
