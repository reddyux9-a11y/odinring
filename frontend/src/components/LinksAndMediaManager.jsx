import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import SimpleLinkManager from "./SimpleLinkManager";
import MediaManager from "./MediaManager";
import { Link as LinkIcon, Image as ImageIcon } from "lucide-react";

const LinksAndMediaManager = ({ links, setLinks, media, setMedia, onBack }) => {
  const [activeTab, setActiveTab] = useState("links");

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="links" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Links
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Media
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="links" className="mt-0">
          <SimpleLinkManager links={links} setLinks={setLinks} onBack={onBack} />
        </TabsContent>
        
        <TabsContent value="media" className="mt-0">
          <MediaManager media={media} setMedia={setMedia} onBack={onBack} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LinksAndMediaManager;



