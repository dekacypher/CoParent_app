import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage, markMessageAsRead, getCurrentUser } from "../lib/api";
import Layout from "@/components/Layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import { Send, Lock, Shield, MessageSquare, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import type { Message } from "@shared/schema";

export default function MessagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => getMessages(),
  });

  const [formData, setFormData] = useState({
    receiverId: "",
    subject: "",
    content: "",
  });

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({
        title: "Message sent",
        description: "Your message has been securely delivered and recorded.",
      });
      setIsDialogOpen(false);
      setFormData({ receiverId: "", subject: "", content: "" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message.",
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markMessageAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMutation.mutate(formData);
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);

    // Mark as read if current user is receiver and message is unread
    if (currentUser && message.receiverId === currentUser.id && !message.isRead) {
      markReadMutation.mutate(message.id);
    }
  };

  // Separate sent and received messages
  const receivedMessages = messages.filter(m => m.receiverId === currentUser?.id);
  const sentMessages = messages.filter(m => m.senderId === currentUser?.id);

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-teal-600" />
            Secure Messages
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Lock className="h-4 w-4" />
            Court-admissible, immutable messaging
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Send New Message</DialogTitle>
                <DialogDescription>
                  All messages are permanently recorded and cannot be edited or deleted.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="receiverId">To (User ID)</Label>
                  <Input
                    id="receiverId"
                    placeholder="Enter receiver's user ID"
                    value={formData.receiverId}
                    onChange={(e) => setFormData({ ...formData, receiverId: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be replaced with a user selector in production
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (optional)</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., School pickup schedule"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    placeholder="Type your message here..."
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <strong>Important:</strong> Messages cannot be edited or deleted once sent. They are timestamped and hashed for court admissibility.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={sendMutation.isPending}>
                  {sendMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receivedMessages.filter(m => !m.isRead).length}
            </div>
            <p className="text-xs text-muted-foreground">New messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivedMessages.length}</div>
            <p className="text-xs text-muted-foreground">Total received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentMessages.length}</div>
            <p className="text-xs text-muted-foreground">Total sent</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inbox */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Inbox</h2>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading messages...</div>
          ) : receivedMessages.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No messages received yet
              </CardContent>
            </Card>
          ) : (
            receivedMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !message.isRead ? "border-teal-300 bg-teal-50/50" : ""
                }`}
                onClick={() => handleMessageClick(message)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {!message.isRead && (
                        <Badge variant="default" className="bg-teal-600">New</Badge>
                      )}
                      {message.subject && (
                        <h3 className="font-semibold">{message.subject}</h3>
                      )}
                    </div>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {message.content}
                  </p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>From: {message.senderId}</span>
                    <span>{format(new Date(message.createdAt), "MMM d, yyyy h:mm a")}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Sent */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Sent Messages</h2>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading messages...</div>
          ) : sentMessages.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No messages sent yet
              </CardContent>
            </Card>
          ) : (
            sentMessages.map((message) => (
              <Card key={message.id} className="cursor-pointer hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {message.subject && (
                        <h3 className="font-semibold">{message.subject}</h3>
                      )}
                      {message.isRead && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCheck className="h-3 w-3 mr-1" />
                          Read
                        </Badge>
                      )}
                    </div>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {message.content}
                  </p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>To: {message.receiverId}</span>
                    <span>{format(new Date(message.createdAt), "MMM d, yyyy h:mm a")}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-600" />
                {selectedMessage.subject || "Message"}
              </DialogTitle>
              <DialogDescription>
                Court-admissible record • Cannot be edited or deleted
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">From:</p>
                  <p className="font-medium">{selectedMessage.senderId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">To:</p>
                  <p className="font-medium">{selectedMessage.receiverId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sent:</p>
                  <p className="font-medium">
                    {format(new Date(selectedMessage.createdAt), "MMM d, yyyy 'at' h:mm:ss a")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status:</p>
                  <p className="font-medium">
                    {selectedMessage.isRead ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCheck className="h-4 w-4" />
                        Read {selectedMessage.readAt && `on ${format(new Date(selectedMessage.readAt), "MMM d, h:mm a")}`}
                      </span>
                    ) : (
                      <span className="text-amber-600">Unread</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 space-y-2 border text-xs">
                <p className="font-semibold text-slate-700">Audit Information</p>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-muted-foreground">Content Hash:</span>
                    <p className="font-mono text-xs break-all">{selectedMessage.contentHash}</p>
                  </div>
                  {selectedMessage.senderIp && (
                    <div>
                      <span className="text-muted-foreground">Sender IP:</span>
                      <p className="font-mono">{selectedMessage.senderIp}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </Layout>
  );
}
