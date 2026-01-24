import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Search } from "lucide-react";
import { AntiCopyProtection } from "@/components/AntiCopyProtection";
import type { LoginAttempt, OtpSession, PostalCodeData } from "@shared/schema";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch data queries
  const { data: loginAttempts = [], isLoading: loadingAttempts } = useQuery<LoginAttempt[]>({
    queryKey: ["/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/login-attempts"],
    enabled: isAuthenticated,
  });

  const { data: otpSessions = [], isLoading: loadingSessions } = useQuery<OtpSession[]>({
    queryKey: ["/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/otp-sessions"],
    enabled: isAuthenticated,
  });

  const { data: postalCodes = [], isLoading: loadingPostal } = useQuery<PostalCodeData[]>({
    queryKey: ["/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/postal-codes"],
    enabled: isAuthenticated,
  });

  const { data: logsData, isLoading: loadingLogs } = useQuery<{ logs: string }>({
    queryKey: ["/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/logs"],
    enabled: isAuthenticated,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await apiRequest("POST", "/api/secure-admin-panel-7f8a9b2c4d5e6f1a3b8c9d0e2f4a6b8c9d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a/login", { password });
      
      if (response.ok) {
        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "Admin authenticated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Authentication failed",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <AntiCopyProtection />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A1628] to-[#1B2B44]">
          <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter admin password to access dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-admin-password"
              />
              <Button type="submit" className="w-full" data-testid="button-admin-login">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </>
    );
  }

  const filteredAttempts = loginAttempts.filter((attempt) =>
    attempt.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attempt.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSessions = otpSessions.filter((session) =>
    session.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.loginAttemptId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPostalCodes = postalCodes.filter((data) =>
    data.loginAttemptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (data.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const logLines = logsData?.logs.split('\n').filter(line => line.trim()).reverse() || [];
  const filteredLogs = logLines.filter(line =>
    line.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      setIsAuthenticated(false);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsAuthenticated(false); // Force logout on client even if API fails
    }
  };

  return (
    <>
      <AntiCopyProtection />
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] to-[#1B2B44] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        <Tabs defaultValue="attempts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attempts" data-testid="tab-attempts">Login Attempts</TabsTrigger>
            <TabsTrigger value="otp" data-testid="tab-otp">OTP Sessions</TabsTrigger>
            <TabsTrigger value="postal" data-testid="tab-postal">Postal Codes</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="attempts">
            <Card>
              <CardHeader>
                <CardTitle>Login Attempts</CardTitle>
                <CardDescription>
                  All login attempts ({filteredAttempts.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAttempts ? (
                  <p>Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>User Agent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttempts.map((attempt) => (
                        <TableRow key={attempt.id} data-testid={`row-attempt-${attempt.id}`}>
                          <TableCell>{new Date(attempt.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{attempt.username}</TableCell>
                          <TableCell>{attempt.status}</TableCell>
                          <TableCell>{attempt.ipAddress}</TableCell>
                          <TableCell className="max-w-xs truncate">{attempt.userAgent}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="otp">
            <Card>
              <CardHeader>
                <CardTitle>OTP Sessions</CardTitle>
                <CardDescription>
                  All OTP verification sessions ({filteredSessions.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <p>Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Created</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Login Attempt ID</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Expires At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((session) => (
                        <TableRow key={session.id} data-testid={`row-otp-${session.id}`}>
                          <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{session.email}</TableCell>
                          <TableCell className="font-mono text-xs">{session.loginAttemptId.substring(0, 8)}...</TableCell>
                          <TableCell>{session.verified}</TableCell>
                          <TableCell>{new Date(session.expiresAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="postal">
            <Card>
              <CardHeader>
                <CardTitle>Postal Code Submissions</CardTitle>
                <CardDescription>
                  All postal code submissions ({filteredPostalCodes.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPostal ? (
                  <p>Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Login Attempt ID</TableHead>
                        <TableHead>Postal Code</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>User Agent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPostalCodes.map((data) => (
                        <TableRow key={data.id} data-testid={`row-postal-${data.id}`}>
                          <TableCell>{new Date(data.timestamp).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">{data.loginAttemptId.substring(0, 8)}...</TableCell>
                          <TableCell>{data.postalCode}</TableCell>
                          <TableCell>{data.ipAddress}</TableCell>
                          <TableCell className="max-w-xs truncate">{data.userAgent}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>
                  Complete audit log ({filteredLogs.length} entries)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <p>Loading...</p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredLogs.map((log, index) => {
                      try {
                        const logData = JSON.parse(log);
                        return (
                          <div key={index} className="p-3 bg-muted rounded-md font-mono text-xs" data-testid={`log-entry-${index}`}>
                            <div className="text-muted-foreground">{logData.loggedAt}</div>
                            <div className="mt-1">{JSON.stringify(logData, null, 2)}</div>
                          </div>
                        );
                      } catch {
                        return (
                          <div key={index} className="p-3 bg-muted rounded-md font-mono text-xs">
                            {log}
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}
