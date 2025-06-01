import { useState, ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWardrobe } from "@/context/WardrobeContext";
import { ClothingItem, ClothingType } from "@/types";
import { uploadImage } from "@/utils/imageUpload";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WardrobePage = () => {
  const {
    clothingItems,
    categories,
    subcategories,
    addClothingItem,
    isLoading,
    isSubmitting,
    refreshWardrobe
  } = useWardrobe();

  // Debug: log categories and subcategories
  // console.log("categories", categories);
  // console.log("subcategories", subcategories);

  // Show loading state if categories or subcategories are not loaded
  if (isLoading || categories.length === 0 || subcategories.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading wardrobe data...
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<"all" | "upper" | "bottom">("all");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const { toast } = useToast();

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<ClothingType | "">("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [itemName, setItemName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value as ClothingType);
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setSelectedSubcategoryId("");
  };

  // DEBUG: Show all categories and subcategories for now
  const filteredCategories = categories;
  const filteredSubcategories = subcategories;
  // console.log('DEBUG: filteredCategories', filteredCategories);
  // console.log('DEBUG: filteredSubcategories', filteredSubcategories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      const image_url = await uploadImage(selectedFile);
      
      const newItem: Omit<ClothingItem, 'id' | 'user_id'> = {
        name: itemName || "Untitled Item",
        image_url: image_url,
        type: selectedType as 'upper' | 'bottom',
        category_id: selectedCategoryId,
        subcategory_id: selectedSubcategoryId,
        color: selectedColor,
        created_at: new Date().toISOString()
      };

      console.log('Submitting item:', newItem); // Debug log
      await addClothingItem(newItem);
      
      toast({
        title: "Success",
        description: "Clothing item added successfully",
      });
      
      // Reset form
      setItemName("");
      setSelectedType("");
      setSelectedCategoryId("");
      setSelectedSubcategoryId("");
      setSelectedColor("#000000");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to add clothing item",
        variant: "destructive",
      });
    }
  };

  const filteredItems = clothingItems.filter((item) => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Unknown";
  };

  const getSubcategoryName = (subcategoryId: string) => {
    const subcategory = subcategories.find((s) => s.id === subcategoryId);
    return subcategory ? subcategory.name : "Unknown";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wardrobe</h1>
            <p className="text-gray-600 mt-1">
              Manage and organize your clothing collection
            </p>
          </div>
          <Button
            className="mt-4 md:mt-0"
            onClick={() => setIsAddingItem(!isAddingItem)}
            variant={isAddingItem ? "outline" : "default"}
          >
            {isAddingItem ? "Cancel" : "Add New Item"}
          </Button>
        </div>

        {isAddingItem && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">
              Add New Clothing Item
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="item-name">Item Name (Optional)</Label>
                    <Input
                      id="item-name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g., Blue Denim Jeans"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={selectedType}
                      onValueChange={handleTypeChange}
                    >
                      <SelectTrigger id="type" className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upper">Upper</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={handleCategoryChange}
                      disabled={!selectedType}
                    >
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Select
                      value={selectedSubcategoryId}
                      onValueChange={setSelectedSubcategoryId}
                      disabled={!selectedCategoryId}
                    >
                      <SelectTrigger id="subcategory" className="w-full">
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubcategories.map((subcategory) => (
                          <SelectItem
                            key={subcategory.id}
                            value={subcategory.id}
                          >
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color">Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="color"
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <span className="text-gray-600">{selectedColor}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Item Image</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-64 flex flex-col items-center justify-center">
                    {previewUrl ? (
                      <div className="relative w-full h-full">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          Click or drag to upload an image
                        </p>
                        <Input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                          ref={fileInputRef}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Browse Files
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingItem(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding Item..." : "Add Item"}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="upper">Upper</TabsTrigger>
              <TabsTrigger value="bottom">Bottom</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No items found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === "all"
                      ? "Your wardrobe is empty. Add some clothes to get started!"
                      : `You don't have any ${activeTab} clothing items yet.`}
                  </p>
                  {!isAddingItem && (
                    <Button onClick={() => setIsAddingItem(true)}>
                      Add Your First Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredItems.map((item: ClothingItem) => (
                    <div key={item.id} className="clothing-card relative group">
                      <div className="h-48 mb-3 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.name || "Clothing item"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.name ||
                          `${getCategoryName(
                            item.category_id
                          )} (${getSubcategoryName(item.subcategory_id)})`}
                      </h3>
                      <div className="flex items-center mt-1">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600">
                          {getSubcategoryName(item.subcategory_id)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WardrobePage;
