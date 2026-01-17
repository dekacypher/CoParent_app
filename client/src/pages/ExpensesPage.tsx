import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExpenses, getChildren, createExpense, updateExpense, deleteExpense } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import { Plus, DollarSign, Calendar, Trash2, Check, X } from "lucide-react";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import type { Expense, InsertExpense } from "@shared/schema";

export default function ExpensesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", selectedFilter !== "all" ? selectedFilter : undefined],
    queryFn: () => getExpenses(undefined, selectedFilter !== "all" ? selectedFilter : undefined),
  });

  const { data: children = [] } = useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
  });

  const [formData, setFormData] = useState<InsertExpense>({
    childId: 0,
    title: "",
    amount: 0,
    category: "other",
    paidBy: "parentA",
    splitPercentage: 50,
    date: new Date().toISOString().split('T')[0],
    receipt: "",
    status: "pending",
    notes: ""
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Expense added",
        description: "The expense has been logged successfully.",
      });
      setIsDialogOpen(false);
      setFormData({
        childId: 0,
        title: "",
        amount: 0,
        category: "other",
        paidBy: "parentA",
        splitPercentage: 50,
        date: new Date().toISOString().split('T')[0],
        receipt: "",
        status: "pending",
        notes: ""
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add expense.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Expense> }) =>
      updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Expense updated",
        description: "The expense status has been updated.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Expense deleted",
        description: "The expense has been removed.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate child is selected
    if (!formData.childId || formData.childId === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a child for this expense.",
      });
      return;
    }

    // Validate amount is positive
    if (!formData.amount || formData.amount <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid amount.",
      });
      return;
    }

    // Convert dollars to cents
    const expenseData = {
      ...formData,
      amount: Math.round(parseFloat(formData.amount.toString()) * 100)
    };
    createMutation.mutate(expenseData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "reimbursed": return "bg-blue-100 text-blue-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      medical: "bg-red-100 text-red-800",
      education: "bg-purple-100 text-purple-800",
      activities: "bg-orange-100 text-orange-800",
      clothing: "bg-pink-100 text-pink-800",
      food: "bg-green-100 text-green-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[category] || colors.other;
  };

  const totalPending = expenses
    .filter(e => e.status === "pending")
    .reduce((sum, e) => sum + e.amount, 0) / 100;

  const totalApproved = expenses
    .filter(e => e.status === "approved")
    .reduce((sum, e) => sum + e.amount, 0) / 100;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Expense Tracking</h1>
            <p className="text-muted-foreground">
              Manage and split childcare expenses
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Expense
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Log New Expense</DialogTitle>
                <DialogDescription>
                  Add a new expense to split with the other parent.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Doctor's visit"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childId">Child</Label>
                  <Select
                    value={formData.childId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, childId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id.toString()}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="activities">Activities</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidBy">Paid By</Label>
                    <Select
                      value={formData.paidBy}
                      onValueChange={(value) => setFormData({ ...formData, paidBy: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parentA">Parent A</SelectItem>
                        <SelectItem value="parentB">Parent B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="splitPercentage">Split Percentage</Label>
                  <Input
                    id="splitPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.splitPercentage}
                    onChange={(e) => setFormData({ ...formData, splitPercentage: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your share: {formData.splitPercentage || 50}% | Other parent: {100 - (formData.splitPercentage || 50)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional details..."
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Expense"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.filter(e => e.status === "pending").length} expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalApproved.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.filter(e => e.status === "approved").length} expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(expenses.reduce((sum, e) => sum + e.amount, 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{expenses.length} total</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          onClick={() => setSelectedFilter("all")}
        >
          All
        </Button>
        <Button
          variant={selectedFilter === "pending" ? "default" : "outline"}
          onClick={() => setSelectedFilter("pending")}
        >
          Pending
        </Button>
        <Button
          variant={selectedFilter === "approved" ? "default" : "outline"}
          onClick={() => setSelectedFilter("approved")}
        >
          Approved
        </Button>
        <Button
          variant={selectedFilter === "reimbursed" ? "default" : "outline"}
          onClick={() => setSelectedFilter("reimbursed")}
        >
          Reimbursed
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No expenses found. Click "Log Expense" to add one.
          </div>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{expense.title}</h3>
                      <Badge className={getCategoryColor(expense.category)}>
                        {expense.category}
                      </Badge>
                      <Badge className={getStatusColor(expense.status)}>
                        {expense.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Amount: <span className="font-semibold text-lg">${(expense.amount / 100).toFixed(2)}</span></p>
                      <p>Paid by: {expense.paidBy === "parentA" ? "Parent A" : "Parent B"}</p>
                      <p>Split: {expense.splitPercentage}% / {100 - expense.splitPercentage}%</p>
                      <p>Date: {format(new Date(expense.date), "MMM d, yyyy")}</p>
                      {expense.notes && <p>Notes: {expense.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {expense.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({
                            id: expense.id,
                            data: { status: "approved" }
                          })}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({
                            id: expense.id,
                            data: { status: "reimbursed" }
                          })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {expense.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMutation.mutate({
                          id: expense.id,
                          data: { status: "reimbursed" }
                        })}
                      >
                        Mark Reimbursed
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
    </Layout>
  );
}
