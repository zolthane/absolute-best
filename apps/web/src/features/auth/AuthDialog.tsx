import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "./authStore";

interface AuthDialogProps {
  mode: "login" | "register";
}

// Login and Register are mechanically identical in Stage 0 - both just
// start the same pretend session (docs/03-build-checklist.md, batch 6: "no
// real passwords, no real accounts") - but shown as two separate entry
// points since a real visitor doesn't yet know that.
const COPY = {
  login: {
    trigger: "Log in",
    title: "Log in",
    description: "No password needed - this is a pretend session for the prototype.",
  },
  register: {
    trigger: "Register",
    title: "Register",
    description: "Pick any username - no real account is created.",
  },
};

export function AuthDialog({ mode }: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const login = useAuthStore((state) => state.login);
  const inputId = useId();
  const copy = COPY[mode];
  const trimmedUsername = username.trim();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmedUsername) {
      return;
    }
    login(trimmedUsername);
    setOpen(false);
    setUsername("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "login" ? "outline" : "default"}>{copy.trigger}</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor={inputId}>Username</Label>
            <Input
              id={inputId}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Your name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!trimmedUsername}>
              {copy.trigger}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
