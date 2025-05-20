import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plumber } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Pencil, Eye, Trash2, UserPlus } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PlumberListProps {
  onAddPlumber: () => void;
  onEditPlumber: (plumber: Plumber) => void;
}

const PlumberList: React.FC<PlumberListProps> = ({ onAddPlumber, onEditPlumber }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: plumbers, isLoading } = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/plumbers/${id}`);
    },
    onSuccess: async () => {
      toast({
        title: "Plumber deleted successfully",
        variant: "default",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/plumbers"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete plumber",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-neutral-darker">Plumbers</h2>
          <Button onClick={onAddPlumber}>
            <UserPlus className="h-4 w-4 mr-1" />
            Add Plumber
          </Button>
        </div>
        <div className="h-96 flex items-center justify-center">
          <p className="text-neutral-dark">Loading plumbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-neutral-darker">Plumbers</h2>
        <Button onClick={onAddPlumber}>
          <UserPlus className="h-4 w-4 mr-1" />
          Add Plumber
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-neutral-light">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Contact Information
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Commission Rate
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral">
            {plumbers && plumbers.length > 0 ? (
              plumbers.map((plumber) => (
                <tr key={plumber.id} className="hover:bg-neutral-light">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-neutral-darker">{plumber.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-neutral-darker">{plumber.email}</div>
                    <div className="text-sm text-neutral-dark">{plumber.phone}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-neutral-darker">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-light bg-opacity-20 text-primary">
                      {plumber.commissionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      plumber.isActive
                        ? "bg-secondary-light bg-opacity-20 text-secondary"
                        : "bg-neutral-light text-neutral-dark"
                    }`}>
                      {plumber.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="icon" onClick={() => onEditPlumber(plumber)}>
                      <Pencil className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4 text-neutral-darker" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the plumber {plumber.name}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-error text-white hover:bg-error-dark"
                            onClick={() => handleDelete(plumber.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-neutral-dark">
                  No plumbers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlumberList;
