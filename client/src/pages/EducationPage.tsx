import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { getReadingList, getSchoolTasks, getHandoverNotes } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, BookOpen, GraduationCap, Link as LinkIcon, ExternalLink } from "lucide-react";
import generatedImage from '@assets/generated_images/abstract_open_book_and_learning_symbols_in_soft_colors.png';

export default function EducationPage() {
  const { data: readingList = [], isLoading: readingLoading } = useQuery({
    queryKey: ["reading-list"],
    queryFn: () => getReadingList()
  });

  const { data: schoolTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["school-tasks"],
    queryFn: () => getSchoolTasks()
  });

  const { data: handoverNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["handover-notes"],
    queryFn: () => getHandoverNotes()
  });

  if (readingLoading || tasksLoading || notesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading education hub...</div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-secondary/20 border border-secondary p-8 flex items-center justify-between">
          <div className="z-10 max-w-xl">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary" />
              Co-Education Hub
            </h1>
            <p className="text-muted-foreground">
              Coordinate school responsibilities, track reading progress, and manage homework together.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-30 pointer-events-none hidden md:block">
               <img src={generatedImage} alt="Education" className="h-full w-full object-cover mix-blend-multiply" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Tasks & Integrations */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* School Integration */}
            <Card className="border-none shadow-sm soft-shadow overflow-hidden">
               <div className="bg-[#0052cc]/5 p-4 border-b border-[#0052cc]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-[#0052cc] rounded-md flex items-center justify-center text-white font-bold">F</div>
                     <span className="font-bold text-[#0052cc]">Fridge Skole</span>
                  </div>
                  <Badge variant="outline" className="bg-white text-green-600 border-green-200 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected
                  </Badge>
               </div>
               <CardContent className="p-0">
                  {schoolTasks.map((task, i) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors group">
                       <div className="flex items-center gap-3">
                          {task.status === 'completed' ? (
                             <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                             <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                          <div>
                             <p className={`font-medium ${task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {task.title}
                             </p>
                             <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
                          </div>
                       </div>
                       <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                       </Button>
                    </div>
                  ))}
               </CardContent>
            </Card>

            {/* Reading Lists */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Shared Reading List
                </h2>
                <Button variant="outline" size="sm">Add Book</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {readingList.map((book) => (
                  <Card key={book.id} className="flex overflow-hidden border-none shadow-sm soft-shadow hover:shadow-md transition-shadow">
                    <div className="w-24 shrink-0">
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm line-clamp-1">{book.title}</h3>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                      </div>
                      <div className="space-y-2 mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{book.progress}%</span>
                        </div>
                        <Progress value={book.progress} className="h-1.5" />
                        <div className="flex justify-between items-center mt-2">
                           <Badge variant="secondary" className="text-[10px] h-5">
                             Currently with {book.assignedTo}
                           </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar: Responsibilities */}
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/10 shadow-none">
               <CardHeader>
                 <CardTitle className="text-primary text-lg">Current Focus</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="bg-white p-3 rounded-lg border border-primary/10 shadow-sm">
                     <p className="text-sm font-medium text-foreground">Math: Fractions & Decimals</p>
                     <p className="text-xs text-muted-foreground mt-1">Focus on converting fractions to decimals this week.</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-primary/10 shadow-sm">
                     <p className="text-sm font-medium text-foreground">Project: Solar System</p>
                     <p className="text-xs text-muted-foreground mt-1">Needs styrofoam balls and paint by Thursday.</p>
                  </div>
               </CardContent>
            </Card>

             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Handover Notes</CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="space-y-4">
                    {handoverNotes.slice(0, 2).map((note) => (
                      <div key={note.id} className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-[hsl(15_50%_65%)]/20 flex items-center justify-center text-[hsl(15_50%_40%)] font-bold text-xs">
                           P{note.parent}
                         </div>
                         <div className="bg-muted/50 p-3 rounded-tr-xl rounded-b-xl flex-1 text-sm">
                            {note.message}
                         </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                     <Button className="w-full" variant="outline">Add Note</Button>
                  </div>
               </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
