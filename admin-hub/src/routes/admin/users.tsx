import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  UserPlus,
  Mail,
  Shield,
  Ban,
  Download,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminRepo, useAdminState } from "@/lib/admin/store";
import { exportToCSV } from "@/lib/admin/export";
import type { AdminUser, UserRole, UserStatus } from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

const initials = (n: string) =>
  n
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function UsersPage() {
  const users = useAdminState((s) => s.users);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        if (role !== "all" && u.role !== role) return false;
        if (status !== "all" && u.status !== status) return false;
        if (
          query &&
          !u.display_name.toLowerCase().includes(query.toLowerCase()) &&
          !u.email.toLowerCase().includes(query.toLowerCase())
        )
          return false;
        return true;
      }),
    [users, query, role, status],
  );

  const doExport = () => {
    exportToCSV(
      filtered,
      [
        { key: "id", label: "ID" },
        { key: "email", label: "Email" },
        { key: "display_name", label: "Meno" },
        { key: "role", label: "Rola" },
        { key: "status", label: "Status" },
        { key: "questions_count", label: "Otázky" },
        { key: "created_at", label: "Registrácia" },
        { key: "last_active_at", label: "Posledná aktivita" },
      ],
      `pouzivatelia-${new Date().toISOString().slice(0, 10)}`,
    );
    toast.success(`Exportovaných ${filtered.length} používateľov`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Používatelia"
        description="Spravujte účty, role a oprávnenia používateľov."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={doExport}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Pozvať
            </Button>
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nový používateľ
            </Button>
          </>
        }
      />

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Hľadať podľa mena alebo emailu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky role</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderátor</SelectItem>
                <SelectItem value="user">Používateľ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky statusy</SelectItem>
                <SelectItem value="active">Aktívny</SelectItem>
                <SelectItem value="suspended">Pozastavený</SelectItem>
                <SelectItem value="pending">Čaká</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Používateľ</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Otázky</TableHead>
                  <TableHead>Registrácia</TableHead>
                  <TableHead>Posledná aktivita</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onConfirm={setConfirm}
                  />
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      Žiadni používatelia
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Zobrazených {filtered.length} z {users.length}
          </p>
        </CardContent>
      </Card>

      <NewUserDialog open={newOpen} onOpenChange={setNewOpen} />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      {confirm && (
        <ConfirmDialog
          open={confirm.open}
          onOpenChange={(o) => setConfirm((c) => (c ? { ...c, open: o } : null))}
          title={confirm.title}
          destructive={confirm.destructive}
          onConfirm={confirm.onConfirm}
        />
      )}
    </div>
  );
}

function UserRow({
  user,
  onConfirm,
}: {
  user: AdminUser;
  onConfirm: (c: {
    open: boolean;
    title: string;
    destructive?: boolean;
    onConfirm: () => void;
  }) => void;
}) {
  const cycleRole = () => {
    const next: UserRole =
      user.role === "user" ? "moderator" : user.role === "moderator" ? "admin" : "user";
    adminRepo.users.update(user.id, { role: next });
    toast.success(`Rola zmenená na ${next}`);
  };
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials(user.display_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.display_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={user.role} />
      </TableCell>
      <TableCell>
        <StatusBadge status={user.status} />
      </TableCell>
      <TableCell className="text-right text-sm tabular-nums">{user.questions_count}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(user.created_at).toLocaleDateString("sk-SK")}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(user.last_active_at).toLocaleDateString("sk-SK")}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akcie</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard?.writeText(user.email);
                toast.success("Email skopírovaný");
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Kopírovať email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={cycleRole}>
              <Shield className="mr-2 h-4 w-4" />
              Otočiť rolu
            </DropdownMenuItem>
            {user.status === "active" ? (
              <DropdownMenuItem
                onClick={() => {
                  adminRepo.users.update(user.id, { status: "suspended" });
                  toast.success("Účet pozastavený");
                }}
              >
                <Ban className="mr-2 h-4 w-4" />
                Pozastaviť
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => {
                  adminRepo.users.update(user.id, { status: "active" });
                  toast.success("Účet aktivovaný");
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aktivovať
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() =>
                onConfirm({
                  open: true,
                  title: `Vymazať ${user.display_name}?`,
                  destructive: true,
                  onConfirm: () => {
                    adminRepo.users.remove(user.id);
                    toast.success("Používateľ vymazaný");
                  },
                })
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Vymazať
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function NewUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [status, setStatus] = useState<UserStatus>("pending");

  const submit = () => {
    if (!name || !email) return toast.error("Vyplňte meno a email");
    adminRepo.users.create({ display_name: name, email, role, status });
    toast.success("Používateľ vytvorený");
    setName("");
    setEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nový používateľ</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid gap-2">
            <Label>Meno</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Rola</Label>
              <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Používateľ</SelectItem>
                  <SelectItem value="moderator">Moderátor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: UserStatus) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Čaká</SelectItem>
                  <SelectItem value="active">Aktívny</SelectItem>
                  <SelectItem value="suspended">Pozastavený</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušiť
          </Button>
          <Button onClick={submit}>Vytvoriť</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [emails, setEmails] = useState("");
  const send = () => {
    const list = emails
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (list.length === 0) return toast.error("Zadajte aspoň jeden email");
    list.forEach((email) =>
      adminRepo.users.create({
        email,
        display_name: email.split("@")[0],
        role: "user",
        status: "pending",
      }),
    );
    toast.success(`Pozvánky odoslané (${list.length})`);
    setEmails("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pozvať používateľov</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Emaily (oddelené čiarkou alebo medzerou)</Label>
          <Input
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="anna@firma.sk, peter@firma.sk"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušiť
          </Button>
          <Button onClick={send}>Odoslať pozvánky</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
