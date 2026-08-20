import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, AlertTriangle, Lightbulb, 
  Rocket, MessageSquare, BookOpen, 
  Loader2, MoreVertical
} from "lucide-react";

export default function EmployeeNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/employee/me/notifications");
        if (res.data.success) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        toast({ title: "Error", description: "Could not load notifications.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({ title: "Updated", description: "All notifications marked as read." });
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now - then) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return then.toLocaleDateString();
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.read === (filter === 'read'));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge className="bg-red-500 text-white border-none px-2 rounded-full">
                {notifications.filter(n => !n.read).length} New
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Alerts, insights, and updates regarding your career</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-xl font-bold text-xs h-9">
            Mark all read
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
            <MoreVertical size={18} className="text-slate-400" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl mb-6">
          <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold text-xs uppercase tracking-widest text-slate-500 data-[state=active]:text-blue-600">All Alerts</TabsTrigger>
          <TabsTrigger value="unread" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold text-xs uppercase tracking-widest text-slate-500 data-[state=active]:text-blue-600">Unread</TabsTrigger>
          <TabsTrigger value="read" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold text-xs uppercase tracking-widest text-slate-500 data-[state=active]:text-blue-600">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent shadow-none py-20">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="text-slate-300" size={30} />
                </div>
                <h3 className="text-lg font-bold text-slate-400">All caught up!</h3>
                <p className="text-sm text-slate-400 max-w-xs mt-1">No {filter !== 'all' ? filter : ''} notifications to show at this time.</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notif) => (
              <NotificationItem 
                key={notif.id} 
                notif={notif} 
                timeLabel={getTimeAgo(notif.time)} 
                onDelete={() => deleteNotification(notif.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationItem({ notif, timeLabel, onDelete }) {
  const getIcon = (type) => {
    switch(type) {
      case 'alert': return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' };
      case 'promotion': return { icon: Rocket, color: 'text-indigo-500', bg: 'bg-indigo-50' };
      case 'insight': return { icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'training': return { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'feedback': return { icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      default: return { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  const config = getIcon(notif.type);

  return (
    <Card className={`group relative transition-all duration-300 border-none ring-1 ring-slate-100 hover:shadow-lg hover:ring-blue-100 ${!notif.read ? 'bg-white' : 'bg-slate-50/50 grayscale-[0.5] opacity-80'}`}>
      {!notif.read && (
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-600 rounded-l-full" />
      )}
      <CardContent className="p-6 flex gap-5">
        <div className={`mt-1 h-12 w-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center flex-shrink-0 shadow-sm border border-black/5`}>
          <config.icon size={22} />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-1">
            <h4 className={`text-base font-bold transition-colors ${!notif.read ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-600'}`}>
              {notif.title}
            </h4>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap ml-4">
              {timeLabel}
            </span>
          </div>
          <p className={`text-sm leading-relaxed ${!notif.read ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
            {notif.message}
          </p>
          
          <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="link" className="p-0 h-auto text-xs font-bold text-blue-600">View Details</Button>
            <div className="h-1 w-1 bg-slate-300 rounded-full" />
            <Button onClick={onDelete} variant="link" className="p-0 h-auto text-xs font-bold text-red-400 hover:text-red-600">Dismiss</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
