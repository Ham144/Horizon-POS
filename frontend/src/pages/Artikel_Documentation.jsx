import React, { useState, useMemo, useEffect } from "react";
import MenuNavigation from "../components/MenuNavigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllDocuments,
  getDocumentById,
  uploadDocument,
} from "../api/documentApi";
import { Upload, Loader, Download, Lock, Search, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import "./Artikel_Documentation.css";
import { useUserInfo } from "@/store";
import { useSearchParams } from "react-router-dom";

const Artikel_Documentation = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("Uncategorized");
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  //dapatkan query search kalau ada
  const searchParams = new URLSearchParams(window.location.search);
  const search = searchParams.get("search");

  const { userInfo } = useUserInfo();

  const { data, isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: getAllDocuments,
    onError: (err) => {
      console.error("Error fetching documents:", err);
      toast.error("Failed to load documents");
    },
  });

  // Handle documents securely
  const documents = data?.documents || [];

  // Ekstrak semua kategori unik untuk filter
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    documents.forEach((doc) => {
      uniqueCategories.add(doc.category || "Uncategorized");
    });
    return Array.from(uniqueCategories);
  }, [documents]);

  // Filter dokumen berdasarkan pencarian dan kategori
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const titleMatch = doc.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const categoryMatch = activeFilter
        ? (doc.category || "Uncategorized") === activeFilter
        : true;
      return titleMatch && categoryMatch;
    });
  }, [documents, searchQuery, activeFilter]);

  const uploadMutation = useMutation({
    mutationFn: ({ file, category }) => {
      const formData = new FormData();

      formData.append("document", file);
      formData.append("category", category);
      formData.append("username", userInfo?.username);
      return uploadDocument(formData);
    },
    onSuccess: (data) => {
      toast.success("Document uploaded successfully");
      setSelectedFile(null);
      queryClient.invalidateQueries(["documents"]);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Error uploading document"
      );
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }

    if (file.name.endsWith(".docx")) {
      setSelectedFile(file);
    } else {
      toast.error("Please select a valid .docx file");
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    uploadMutation.mutate({ file: selectedFile, category });
  };

  const handleDocumentClick = async (docId) => {
    try {
      const response = await getDocumentById(docId);
      if (response && response.document) {
        setSelectedDoc(response.document);
      } else {
        toast.error("Invalid document data received");
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Error loading document");
    }
  };

  const handleDownload = async (docId) => {
    try {
      setIsDownloading(true);

      if (!response || !response.fileData) {
        throw new Error("Invalid file data received");
      }

      // Create a download link for the base64 data
      const link = document.createElement("a");
      link.href = response.fileData;
      link.download = response.fileName || "document.docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsDownloading(false);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Error downloading document");
      setIsDownloading(false);
    }
  };

  const handleFilterClick = (category) => {
    setActiveFilter(activeFilter === category ? "" : category);
  };

  useEffect(() => {
    if (search) {
      setSearchQuery(search);
    }
  }, [search]);

  return (
    <div className="mt-20">
      <MenuNavigation />
      <div className="documentation-container">
        <div className="documentation-header">
          <h1 className="documentation-title">Documentation</h1>
          {userInfo?.username ? (
            <label className="upload-button">
              <input
                type="file"
                className="hidden-input"
                accept=".docx"
                onChange={handleFileChange}
                disabled={uploadMutation.isLoading}
              />
              <span className="button-content">
                <Upload className="upload-icon" />
                Upload .docx
              </span>
            </label>
          ) : (
            <div className="upload-button">
              <span className="button-content">
                <Lock className="upload-icon" />
                Login Jika Ingin Upload Artikel Doc
              </span>
            </div>
          )}
        </div>

        {uploadMutation.isLoading && (
          <div className="loading-container">
            <Loader className="spinner" />
          </div>
        )}

        {selectedFile && !uploadMutation.isLoading && (
          <div className="upload-form my-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">
              Upload Document: {selectedFile.name}
            </h3>

            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="select select-bordered w-full"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Uncategorized">Uncategorized</option>
                <option value="Mobile App">Mobile App</option>
                <option value="CMS">CMS</option>
                <option value="IT Technical">IT Technical</option>
                <option value="Pemecahan Masalah Sementara">
                  Pemecahan Masalah Sementara
                </option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploadMutation.isLoading}
            >
              Upload Document
            </button>
          </div>
        )}

        <div className="content-container">
          {/* Document List */}
          <div className="document-list">
            <div className="flex flex-col space-y-4 mb-4">
              <h2 className="section-title">Documents</h2>

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="Cari dokumen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 flex items-center mr-2">
                  <Filter className="h-4 w-4 mr-1" /> Filter:
                </span>
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className={`badge badge-secondary rounded-lg cursor-pointer ${
                      activeFilter === cat ? "badge-primary" : "badge-outline"
                    }`}
                    onClick={() => handleFilterClick(cat)}
                  >
                    {cat}
                  </span>
                ))}
                {activeFilter && (
                  <span
                    className="badge badge-error rounded-lg cursor-pointer"
                    onClick={() => setActiveFilter("")}
                  >
                    Reset
                  </span>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="loading-container">
                <Loader className="spinner" />
              </div>
            ) : error ? (
              <div className="error-message">
                Failed to load documents. Please try again.
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="no-documents">
                {documents.length === 0
                  ? "No documents found. Upload a document to get started."
                  : "No documents match your search criteria."}
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc._id}
                  className="document-item"
                  onClick={() => handleDocumentClick(doc._id)}
                >
                  <h3 className="document-title">{doc.title}</h3>
                  <p className="document-meta">
                    By {doc.uploadedBy || "Unknown"} on{" "}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  <span className="badge badge-ghost">
                    {doc.category || "Uncategorized"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Document Content */}
          <div className="document-content">
            {selectedDoc ? (
              <>
                <h2 className="content-title">{selectedDoc.title}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge badge-primary">
                    {selectedDoc.category || "Uncategorized"}
                  </span>
                  <span className="text-sm text-gray-500">
                    Uploaded on{" "}
                    {new Date(selectedDoc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div
                  className="content-body"
                  dangerouslySetInnerHTML={{
                    __html: selectedDoc.content || "",
                  }}
                />
                <div className="mt-4">
                  <button
                    onClick={() => handleDownload(selectedDoc._id)}
                    disabled={isDownloading}
                    className="btn btn-outline btn-sm"
                  >
                    {isDownloading ? (
                      <Loader size={16} className="animate-spin mr-2" />
                    ) : (
                      <Download size={16} className="mr-2" />
                    )}
                    Download Original Document
                  </button>
                </div>
              </>
            ) : (
              <p className="no-content">
                Select a document to view its content
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Artikel_Documentation;
