import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Download,
  Eye,
  Trash2,
  Search,
} from "lucide-react";

interface AccountFilesTabProps {
  accountId: string;
}

// Placeholder - this would be replaced with actual file management API
export default function AccountFilesTab({ accountId }: AccountFilesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with actual API call
  const files = [
    {
      id: "1",
      name: "Contract_2024.pdf",
      type: "pdf",
      size: "2.4 MB",
      uploadedBy: "John Doe",
      uploadedOn: "2024-01-15",
    },
    {
      id: "2",
      name: "Product_Presentation.pptx",
      type: "pptx",
      size: "5.1 MB",
      uploadedBy: "Jane Smith",
      uploadedOn: "2024-01-10",
    },
    {
      id: "3",
      name: "Budget_Q1.xlsx",
      type: "xlsx",
      size: "890 KB",
      uploadedBy: "Mike Johnson",
      uploadedOn: "2024-01-08",
    },
  ];

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "xlsx":
      case "csv":
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case "jpg":
      case "png":
      case "gif":
        return <Image className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Files ({files.length})</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm
              ? "No files found matching your search"
              : "No files uploaded yet. Click 'Upload File' to add one."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Uploaded On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.type)}
                      {file.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{file.type.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell>{file.uploadedBy}</TableCell>
                  <TableCell>{new Date(file.uploadedOn).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" title="Preview">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
