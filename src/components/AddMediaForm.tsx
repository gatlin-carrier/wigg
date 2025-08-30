import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface MediaFormData {
  title: string;
  type: "TV Show" | "Movie" | "Book" | "Podcast" | "Game" | "Other";
  hours: number;
  minutes: number;
  author: string;
}

interface AddMediaFormProps {
  onSubmit: (data: MediaFormData) => void;
}

export const AddMediaForm = ({ onSubmit }: AddMediaFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<MediaFormData>({
    title: "",
    type: "TV Show",
    hours: 0,
    minutes: 0,
    author: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.author) {
      onSubmit(formData);
      setFormData({
        title: "",
        type: "TV Show",
        hours: 0,
        minutes: 0,
        author: ""
      });
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-primary hover:opacity-90 shadow-medium hover:shadow-strong transition-all duration-300 h-12 px-8"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New Entry
      </Button>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card border-0 shadow-medium">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Add New Media Entry</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter media title..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TV Show">TV Show</SelectItem>
                <SelectItem value="Movie">Movie</SelectItem>
                <SelectItem value="Book">Book</SelectItem>
                <SelectItem value="Podcast">Podcast</SelectItem>
                <SelectItem value="Game">Game</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Time to Get Good</Label>
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                placeholder="Hours"
              />
            </div>
            <span className="text-muted-foreground">hours</span>
            <div className="flex-1">
              <Input
                type="number"
                min="0"
                max="59"
                value={formData.minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                placeholder="Minutes"
              />
            </div>
            <span className="text-muted-foreground">minutes</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">Your Name</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
            placeholder="Enter your name..."
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            type="submit"
            className="bg-gradient-primary hover:opacity-90 shadow-soft transition-all duration-300"
          >
            Add Entry
          </Button>
          <Button 
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};