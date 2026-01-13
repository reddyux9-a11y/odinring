import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Button } from "./ui/button";
import { Edit, Trash2, Copy, Share } from "lucide-react";
import { toast } from "sonner";

const SwipeableLink = ({ 
  link, 
  onEdit, 
  onDelete, 
  onCopy, 
  onShare, 
  children, 
  className = "" 
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-150, -75, 0, 75, 150],
    ["#ef4444", "#f97316", "#ffffff", "#10b981", "#3b82f6"]
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 75;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      if (offset > 0) {
        // Swiped right - Edit action
        handleEdit();
      } else {
        // Swiped left - Delete action  
        handleDelete();
      }
      setIsRevealed(true);
    } else {
      setIsRevealed(false);
    }
  };

  const handleEdit = () => {
    onEdit(link);
    toast.success("Opening editor...");
    setIsRevealed(false);
  };

  const handleDelete = () => {
    onDelete(link.id);
    toast.success("Link deleted");
    setIsRevealed(false);
  };

  const handleCopy = () => {
    onCopy(link.url);
    setIsRevealed(false);
  };

  const handleShare = () => {
    onShare(link);
    setIsRevealed(false);
  };

  return (
    <div ref={constraintsRef} className={`relative overflow-hidden ${className}`}>
      {/* Background Actions */}
      <div className="absolute inset-0 flex">
        {/* Left side - Delete */}
        <motion.div
          className="flex-1 bg-red-500 flex items-center justify-start px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: isRevealed && x.get() < -75 ? 1 : 0 }}
        >
          <div className="flex items-center space-x-2 text-white">
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Delete</span>
          </div>
        </motion.div>

        {/* Right side - Edit */}
        <motion.div
          className="flex-1 bg-green-500 flex items-center justify-end px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: isRevealed && x.get() > 75 ? 1 : 0 }}
        >
          <div className="flex items-center space-x-2 text-white">
            <span className="font-medium">Edit</span>
            <Edit className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.2}
        style={{ x, background }}
        onDragEnd={handleDragEnd}
        className="relative z-10 cursor-grab active:cursor-grabbing"
        whileDrag={{ scale: 1.02 }}
        animate={{
          x: isRevealed ? (x.get() > 0 ? 100 : -100) : 0
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40
        }}
      >
        {children}

        {/* Quick Actions Overlay */}
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-2 right-2 flex space-x-1"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
            >
              <Share className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Swipe Hint */}
      {!isRevealed && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none"
        >
          ← Swipe →
        </motion.div>
      )}
    </div>
  );
};

export default SwipeableLink;