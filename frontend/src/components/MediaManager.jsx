import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
  X,
  Upload
} from "lucide-react";
import { FadeInUp } from "./PageTransitions";
import { mobileToast } from "./MobileOptimizedToast";
import { addHapticFeedback } from "../utils/mobileUtils";
import api from "../lib/api";

const MediaManager = ({ media, setMedia, onBack }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const editImageInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: "",
    type: "image",
    url: "",
    media_file_url: "",
    thumbnail_url: "",
    description: ""
  });

  const MAX_MEDIA_FILES = 6;

  useEffect(() => {
    // Only load media if user is authenticated (has token)
    const token = localStorage.getItem('token');
    if (token) {
      loadMedia();
    } else {
      // If no token, just set empty array and skip loading
      if (setMedia) {
        setMedia([]);
      }
      setLoading(false);
    }
  }, []);

  const loadMedia = async () => {
    // Double-check token before making request
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token available, skipping media load');
      if (setMedia) {
        setMedia([]);
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/media');
      if (setMedia) {
        setMedia(response.data || []);
      }
    } catch (error) {
      // Only show error if it's not a 401/403 (authentication issue)
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Failed to load media:', error);
        mobileToast.error("Failed to load media files");
      } else {
        // Silent fail for auth errors - user will be redirected by ProtectedRoute
        console.log('Media load skipped - authentication required');
        if (setMedia) {
          setMedia([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      mobileToast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      mobileToast.error("Image size must be less than 5MB");
      return;
    }

    setImageFile(file);
    addHapticFeedback('light');

    // Create immediate preview using FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result;
      setImagePreview(previewUrl);
    };
    reader.readAsDataURL(file);

    // Upload the file
    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await api.post('/upload-media', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const imageUrl = response.data.image_url;
        const thumbnailUrl = response.data.thumbnail_url || imageUrl; // Use thumbnail if available, fallback to main image
        setFormData(prev => ({ 
          ...prev, 
          url: imageUrl, 
          media_file_url: imageUrl,
          thumbnail_url: thumbnailUrl
        }));
        addHapticFeedback('success');
        mobileToast.success("Image uploaded and optimized successfully");
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      addHapticFeedback('error');
      mobileToast.error("Failed to upload image");
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    addHapticFeedback('light');

    // Prevent submission if image is still uploading
    if (uploadingImage) {
      mobileToast.error("Please wait for the image to finish uploading");
      return;
    }

    // Validate based on type
    if (!formData.title.trim()) {
      mobileToast.error("Please fill in the title");
      return;
    }

    if (formData.type === "image") {
      if (!formData.url || !formData.url.trim()) {
        if (imageFile) {
          mobileToast.error("Please wait for the image to finish uploading");
          return;
        }
        mobileToast.error("Please upload an image or provide an image URL");
        return;
      }
      // Ensure URL is valid HTTP/HTTPS URL or data URL (for uploaded images)
      const urlPattern = /^(https?:\/\/|data:)/i;
      if (!formData.url.trim().match(urlPattern)) {
        mobileToast.error("Image URL must start with http://, https://, or data:");
        return;
      }
      // Validate media_file_url if provided
      if (formData.media_file_url && formData.media_file_url.trim()) {
        if (!formData.media_file_url.trim().match(urlPattern)) {
          mobileToast.error("Media file URL must start with http://, https://, or data:");
          return;
        }
      }
    }

    if (formData.type === "video" && !formData.url.trim()) {
      mobileToast.error("Please provide a video embed URL");
      return;
    }

    // Check if we're at the limit
    const currentCount = media?.length || 0;
    if (!editingMedia && currentCount >= MAX_MEDIA_FILES) {
      mobileToast.error(`Maximum ${MAX_MEDIA_FILES} media files allowed`);
      return;
    }

    setLoading(true);
    try {
      // Prepare data for submission - only include media_file_url and thumbnail_url if they have values
      const submitData = { ...formData };
      if (!submitData.media_file_url || submitData.media_file_url.trim() === '') {
        delete submitData.media_file_url;
      }
      // Include thumbnail_url if available (for optimized images)
      if (!submitData.thumbnail_url || submitData.thumbnail_url.trim() === '') {
        // Don't delete, just ensure it's set to url if not provided
        if (submitData.type === 'image' && submitData.url) {
          submitData.thumbnail_url = submitData.url;
        } else {
          delete submitData.thumbnail_url;
        }
      }
      
      if (editingMedia) {
        // Update existing media
        const response = await api.put(`/media/${editingMedia.id}`, submitData);
        if (setMedia) {
          setMedia(media.map(m => m.id === editingMedia.id ? response.data : m));
        }
        mobileToast.success("Media updated successfully");
        setIsEditDialogOpen(false);
        // Reset form and image state after successful update
        setFormData({
          title: "",
          type: "image",
          url: "",
          media_file_url: "",
          thumbnail_url: "",
          description: ""
        });
        setImageFile(null);
        setImagePreview(null);
        setEditingMedia(null);
        // Reset file input
        if (editImageInputRef.current) {
          editImageInputRef.current.value = '';
        }
      } else {
        // Create new media
        const response = await api.post('/media', submitData);
        if (setMedia) {
          setMedia([...media, response.data]);
        }
        mobileToast.success("Media added successfully");
        setIsAddDialogOpen(false);
      }
      
      // Reset form only after create (not after update, as it's already reset above)
      if (!editingMedia) {
        setFormData({
          title: "",
          type: "image",
          url: "",
          media_file_url: "",
          thumbnail_url: "",
          description: ""
        });
        setImageFile(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Save failed:', error);
      let errorMessage = "Failed to save media";
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Handle array of validation errors
        if (Array.isArray(detail)) {
          errorMessage = detail.map(err => {
            if (typeof err === 'string') return err;
            if (err && typeof err === 'object' && err.msg) return String(err.msg);
            return String(err);
          }).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (detail && typeof detail === 'object' && detail.msg) {
          errorMessage = String(detail.msg);
        } else {
          errorMessage = String(detail);
        }
      }
      
      // Ensure errorMessage is always a string
      mobileToast.error(String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mediaItem) => {
    setEditingMedia(mediaItem);
    setFormData({
      title: mediaItem.title || "",
      type: mediaItem.type || "image",
      url: mediaItem.url || "",
      media_file_url: mediaItem.media_file_url || mediaItem.url || "",
      thumbnail_url: mediaItem.thumbnail_url || "",
      description: mediaItem.description || ""
    });
    setImageFile(null);
    setImagePreview(null);
    setIsEditDialogOpen(true);
    addHapticFeedback('light');
  };

  const handleDelete = async (mediaId) => {
    if (!window.confirm("Are you sure you want to delete this media file?")) {
      return;
    }

    setLoading(true);
    addHapticFeedback('light');

    try {
      await api.delete(`/media/${mediaId}`);
      if (setMedia) {
        setMedia(media.filter(m => m.id !== mediaId));
      }
      addHapticFeedback('success');
      mobileToast.success("Media deleted successfully");
    } catch (error) {
      console.error('Delete failed:', error);
      addHapticFeedback('error');
      mobileToast.error("Failed to delete media");
    } finally {
      setLoading(false);
    }
  };

  const toggleMediaVisibility = async (mediaId, currentActive) => {
    try {
      const response = await api.put(`/media/${mediaId}`, { active: !currentActive });
      if (setMedia) {
        setMedia(media.map(m => m.id === mediaId ? response.data : m));
      }
      mobileToast.success(currentActive ? "Media hidden" : "Media shown");
    } catch (error) {
      console.error('Toggle visibility failed:', error);
      mobileToast.error("Failed to update visibility");
    }
  };

  const currentCount = media?.length || 0;
  const canAddMore = currentCount < MAX_MEDIA_FILES;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Media Files</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add images and videos with embed links (Max {MAX_MEDIA_FILES} files)
          </p>
        </div>
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <X className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Add Media Button */}
      <div className="mb-4">
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setImageFile(null);
            setImagePreview(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="w-full sm:w-auto" 
              disabled={!canAddMore || loading}
              onClick={() => {
                setFormData({
                  title: "",
                  type: "image",
                  url: "",
                  media_file_url: "",
                  thumbnail_url: "",
                  description: ""
                });
                setImageFile(null);
                setImagePreview(null);
                setEditingMedia(null);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Media File</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter media title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, type: value, url: "" });
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">
                      <div className="flex items-center">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Image
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center">
                        <Video className="h-4 w-4 mr-2" />
                        Video
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image File Upload */}
              {formData.type === "image" && (
                <div>
                  <Label htmlFor="image-upload">Upload Image *</Label>
                  <div className="mt-2">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="cursor-pointer"
                      disabled={uploadingImage}
                    />
                    {imagePreview && (
                      <div className="mt-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
                      </div>
                    )}
                    {uploadingImage && (
                      <p className="text-xs text-muted-foreground mt-2">Uploading image...</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload an image file (Max 5MB). Supported formats: JPG, PNG, GIF, WebP
                  </p>
                </div>
              )}

              {/* Video Embed URL */}
              {formData.type === "video" && (
                <div>
                  <Label htmlFor="url">Video Embed URL (iframe) *</Label>
                  <Textarea
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="<iframe src='https://www.youtube.com/embed/VIDEO_ID' width='560' height='315' frameborder='0' allowfullscreen></iframe>"
                    required
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the full iframe embed code for the video (e.g., YouTube, Vimeo embed iframe)
                  </p>
                </div>
              )}

              {formData.type === "video" && (
                <div>
                  <Label htmlFor="thumbnail_url">Thumbnail URL (Optional)</Label>
                  <Input
                    id="thumbnail_url"
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional thumbnail image for the video
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Media"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Media Count Badge */}
      <div className="mb-4">
        <Badge variant="secondary">
          {currentCount} / {MAX_MEDIA_FILES} media files
        </Badge>
      </div>

      {/* Media List */}
      {loading && media?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Loading media...</div>
      ) : media?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No media files yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add your first media file to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {media
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((mediaItem) => (
              <FadeInUp key={mediaItem.id}>
                <Card className="bg-gray-900 border-gray-800 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                  {/* Navigation Bar with Edit and Delete Icons */}
                  <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center justify-end gap-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0)', background: 'unset' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(mediaItem)}
                      className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mediaItem.id)}
                      className="h-8 w-8 p-0 text-gray-300 hover:text-red-400 hover:bg-gray-700 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Image/Video Container */}
                  <div className="relative">
                    {mediaItem.type === "image" ? (
                      <div className="aspect-video bg-gray-800 overflow-hidden">
                        <img
                          src={mediaItem.url}
                          alt={mediaItem.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23333' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                    ) : mediaItem.type === "video" ? (
                      <div className="aspect-video bg-gray-800 overflow-hidden flex items-center justify-center">
                        {mediaItem.thumbnail_url ? (
                          <img
                            src={mediaItem.thumbnail_url}
                            alt={mediaItem.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Video className="h-12 w-12 text-gray-600" />
                        )}
                      </div>
                    ) : null}
                  </div>
                  
                  {/* Title and Description Section */}
                  <CardContent className="p-4 bg-gray-900" style={{ backgroundColor: 'rgba(0, 0, 0, 1)' }}>
                    <CardTitle className="text-lg font-semibold text-white mb-2 line-clamp-1">
                      {mediaItem.title}
                    </CardTitle>
                    {mediaItem.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {mediaItem.description}
                      </p>
                    )}
                    {!mediaItem.active && (
                      <Badge variant="secondary" className="mt-2 bg-gray-800 text-gray-400 border-gray-700">
                        Hidden
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </FadeInUp>
            ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          // Reset state when dialog closes
          setImageFile(null);
          setImagePreview(null);
          setEditingMedia(null);
          setFormData({
            title: "",
            type: "image",
            url: "",
            media_file_url: "",
            thumbnail_url: "",
            description: ""
          });
          // Reset file input
          if (editImageInputRef.current) {
            editImageInputRef.current.value = '';
          }
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Media File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter media title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value, url: "" });
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Image
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-2" />
                      Video
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image File Upload for Edit */}
            {formData.type === "image" && (
              <div>
                <Label htmlFor="edit-image-upload">Upload Image *</Label>
                <div className="mt-2">
                  <Input
                    id="edit-image-upload"
                    ref={editImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="cursor-pointer"
                    disabled={uploadingImage}
                  />
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                    </div>
                  )}
                  {formData.url && !imagePreview && (
                    <div className="mt-3">
                      <img
                        src={formData.url}
                        alt="Current"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Current image</p>
                    </div>
                  )}
                  {uploadingImage && (
                    <p className="text-xs text-muted-foreground mt-2">Uploading image...</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a new image file (Max 5MB) or keep the current one
                </p>
              </div>
            )}

            {/* Video Embed URL for Edit */}
            {formData.type === "video" && (
              <div>
                <Label htmlFor="edit-url">Video Embed URL (iframe) *</Label>
                <Textarea
                  id="edit-url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="<iframe src='https://www.youtube.com/embed/VIDEO_ID' width='560' height='315' frameborder='0' allowfullscreen></iframe>"
                  required
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste the full iframe embed code for the video (e.g., YouTube, Vimeo embed iframe)
                </p>
              </div>
            )}

            {formData.type === "video" && (
              <div>
                <Label htmlFor="edit-thumbnail_url">Thumbnail URL (Optional)</Label>
                <Input
                  id="edit-thumbnail_url"
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
            )}

            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingMedia(null);
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Media"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaManager;

