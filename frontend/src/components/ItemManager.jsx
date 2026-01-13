import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  ShoppingBag,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Tag
} from "lucide-react";
import { FadeInUp } from "./PageTransitions";
import { mobileToast } from "./MobileOptimizedToast";
import { addHapticFeedback } from "../utils/mobileUtils";
import api from "../lib/api";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Custom DialogContent without close button
const CustomDialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
CustomDialogContent.displayName = "CustomDialogContent";

const ItemManager = ({ items, setItems }) => {
  console.log('🛍️ ItemManager: Component rendered with items:', items);
  console.log('🛍️ ItemManager: Items count:', items?.length || 0);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    image_url: "",
    tags: []
  });

  // Currency options
  const currencyOptions = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR"];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      currency: "USD",
      image_url: "",
      tags: []
    });
    setImagePreview(null);
  };

  const handleImageUpload = async (event) => {
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

    // Create immediate preview using FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result;
      setImagePreview(previewUrl);
      // Update form data immediately with preview
      setFormData(prev => ({ 
        ...prev, 
        image_url: previewUrl
      }));
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    addHapticFeedback('light');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      // Use existing /upload-logo API
      const response = await api.post('/upload-logo', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update form data with server response (base64 URL)
        const logoUrl = response.data.logo_url;
        setFormData(prev => ({ 
          ...prev, 
          image_url: logoUrl
        }));
        setImagePreview(logoUrl);
        
        mobileToast.success("Image uploaded successfully!");
        addHapticFeedback('success');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      mobileToast.error("Failed to upload image");
      addHapticFeedback('error');
      // Revert preview on error
      setImagePreview(null);
      setFormData(prev => ({ 
        ...prev, 
        image_url: ""
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price) {
      mobileToast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    addHapticFeedback('light');

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/items`, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        image_url: formData.image_url || null,
        tags: formData.tags
      });

      // Update state with new item
      const newItem = response.data;
      setItems(prev => {
        // Check if item already exists (prevent duplicates)
        const exists = prev.some(item => item.id === newItem.id);
        if (exists) {
          console.log('⚠️ Item already in state, updating instead of adding');
          return prev.map(item => item.id === newItem.id ? newItem : item);
        }
        return [...prev, newItem];
      });
      setIsAddDialogOpen(false);
      resetForm();
      addHapticFeedback('success');
      mobileToast.success("Item added successfully");
      console.log('✅ Item added to state:', newItem.id, newItem.name);
    } catch (error) {
      console.error('Add item failed:', error);
      addHapticFeedback('error');
      mobileToast.error(error.response?.data?.detail || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      currency: item.currency || "USD",
      image_url: item.image_url || "",
      tags: item.tags || []
    });
    setImagePreview(item.image_url || null);
    setIsEditDialogOpen(true);
    addHapticFeedback('light');
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.price) {
      mobileToast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    addHapticFeedback('light');

    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/items/${editingItem.id}`, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        image_url: formData.image_url || null,
        tags: formData.tags
      });

      setItems(prev => prev.map(item => item.id === editingItem.id ? response.data : item));
      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      addHapticFeedback('success');
      mobileToast.success("Item updated successfully");
    } catch (error) {
      console.error('Update item failed:', error);
      addHapticFeedback('error');
      mobileToast.error(error.response?.data?.detail || "Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setLoading(true);
    addHapticFeedback('light');

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/items/${itemId}`);

      setItems(prev => prev.filter(item => item.id !== itemId));
      addHapticFeedback('success');
      mobileToast.success("Item deleted successfully");
    } catch (error) {
      console.error('Delete failed:', error);
      addHapticFeedback('error');
      mobileToast.error("Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemVisibility = async (itemId, currentActive) => {
    try {
      await api.put(`/items/${itemId}`, {
        active: !currentActive
      });
      
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, active: !currentActive } : item
      ));
      
      addHapticFeedback('success');
      mobileToast.success(currentActive ? "Item hidden" : "Item visible");
    } catch (error) {
      console.error('Toggle visibility failed:', error);
      addHapticFeedback('error');
      mobileToast.error("Failed to toggle visibility");
    }
  };

  const moveItem = async (index, direction) => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Validate that all items have IDs
    const itemsWithoutIds = newItems.filter(item => !item.id);
    if (itemsWithoutIds.length > 0) {
      console.error('❌ Some items are missing IDs:', itemsWithoutIds);
      mobileToast.error("Cannot reorder: Some items are missing IDs");
      return;
    }
    
    const reorderedItems = newItems.map((item, idx) => ({
      id: item.id,
      order: idx
    }));
    
    try {
      console.log('🔄 Reordering items:', reorderedItems);
      const response = await api.put(`/items/reorder`, reorderedItems);
      console.log('✅ Reorder successful:', response.data);
      setItems(newItems);
      addHapticFeedback('light');
      mobileToast.success("Items reordered successfully! 🔄");
    } catch (error) {
      console.error('❌ Reorder failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: reorderedItems
      });
      
      // Extract error message safely - handle both string and array formats
      let errorMessage = "Failed to reorder items";
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // FastAPI validation errors are arrays of objects
          errorMessage = detail.map(err => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            return JSON.stringify(err);
          }).join(', ') || "Validation error";
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else {
          errorMessage = String(detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      mobileToast.error(errorMessage);
      // Revert the UI change on error
      setItems(items);
    }
  };

  const formatPrice = (price, currency) => {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      AUD: "A$",
      CAD: "C$",
      CHF: "CHF",
      CNY: "¥",
      INR: "₹"
    };
    return `${symbols[currency] || currency} ${price.toFixed(2)}`;
  };

  return (
    <FadeInUp>
      <Card className="shadow-lg border-border/50 bg-card/80 backdrop-blur-sm" style={{ width: '551px' }}>
        <CardHeader className="w-full flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Merchant Items
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  resetForm();
                  addHapticFeedback('light');
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <CustomDialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Create a new product or service listing for your profile.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item-name">Item Name *</Label>
                  <Input
                    id="item-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Product name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="item-description">Description</Label>
                  <Textarea
                    id="item-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Item description"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item-price">Price *</Label>
                    <Input
                      id="item-price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="item-currency">Currency</Label>
                    <select
                      id="item-currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={loading}
                    >
                      {currencyOptions.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="item-image">Item Image</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Recommended size: 200px × 200px
                  </p>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-3">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-[200px] h-[200px] object-cover rounded-lg border border-border"
                      />
                    </div>
                  )}
                  
                  {/* File Upload Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      id="item-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={loading || uploadingImage}
                      className="cursor-pointer"
                    />
                    {uploadingImage && (
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    )}
                  </div>
                  
                  {/* Fallback: URL input (optional) */}
                  <div className="mt-2">
                    <Label htmlFor="item-image-url" className="text-xs text-muted-foreground">
                      Or enter image URL (optional)
                    </Label>
                    <Input
                      id="item-image-url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value || null);
                      }}
                      placeholder="https://example.com/image.jpg"
                      disabled={loading || uploadingImage}
                      className="mt-1"
                    />
                  </div>
                </div>


                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAdd}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Adding..." : "Add Item"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CustomDialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <CustomDialogContent>
              <DialogHeader>
                <DialogTitle>Edit Item</DialogTitle>
                <DialogDescription>
                  Update your product or service details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-item-name">Item Name *</Label>
                  <Input
                    id="edit-item-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Product name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-item-description">Description</Label>
                  <Textarea
                    id="edit-item-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Item description"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-item-price">Price *</Label>
                    <Input
                      id="edit-item-price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-item-currency">Currency</Label>
                    <select
                      id="edit-item-currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={loading}
                    >
                      {currencyOptions.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-item-image">Item Image</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Recommended size: 200px × 200px
                  </p>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-3">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-[200px] h-[200px] object-cover rounded-lg border border-border"
                      />
                    </div>
                  )}
                  
                  {/* File Upload Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-item-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={loading || uploadingImage}
                      className="cursor-pointer"
                    />
                    {uploadingImage && (
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    )}
                  </div>
                  
                  {/* Fallback: URL input (optional) */}
                  <div className="mt-2">
                    <Label htmlFor="edit-item-image-url" className="text-xs text-muted-foreground">
                      Or enter image URL (optional)
                    </Label>
                    <Input
                      id="edit-item-image-url"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value || null);
                      }}
                      placeholder="https://example.com/image.jpg"
                      disabled={loading || uploadingImage}
                      className="mt-1"
                    />
                  </div>
                </div>


                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Updating..." : "Update Item"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CustomDialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="w-full p-3 sm:p-6 ml-0">
          {!items || items.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-muted mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No items yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">Add your first product or service</p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3 overflow-x-hidden">
              {items.map((item, index) => (
                <div key={item.id} className="border border-border rounded-2xl transition-all duration-300 bg-card/80 backdrop-blur-sm hover:bg-card/90 hover:shadow-lg hover:border-border">
                  <div className="p-2 sm:p-4">
                    <div className="flex items-center sm:items-start gap-1 sm:gap-3">
                      {/* Reorder arrows */}
                      <div className="flex flex-col -my-1">
                        <button
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item image */}
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-base truncate">
                            {item.name}
                          </h3>
                          {item.active ? (
                            <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                              <Eye className="w-3 h-3 mr-1" />
                              Visible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                          <span className="font-semibold text-primary">{formatPrice(item.price, item.currency)}</span>
                          <span>{item.views || 0} views</span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleItemVisibility(item.id, item.active)}
                        >
                          {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </FadeInUp>
  );
};

export default ItemManager;

