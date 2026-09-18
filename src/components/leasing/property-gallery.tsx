"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function PropertyGallery({
  images,
  name,
}: {
  images: { src: string; alt: string }[];
  name: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const move = (direction: number) =>
    setActive(
      (index) => ((index ?? 0) + direction + images.length) % images.length,
    );
  return (
    <>
      <div className="leasing-gallery">
        {images.map((photo, i) => (
          <button
            key={photo.src}
            onClick={() => setActive(i)}
            aria-label={`View photo ${i + 1} of ${name}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority={i === 0}
              sizes={i === 0 ? "(max-width: 700px) 100vw, 65vw" : "33vw"}
            />
            {i === 0 && (
              <span>
                <Images size={16} /> Explore {images.length} photos
              </span>
            )}
          </button>
        ))}
      </div>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent
          className="gallery-dialog"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") move(-1);
            if (event.key === "ArrowRight") move(1);
          }}
        >
          <DialogTitle>{name} · A look inside</DialogTitle>
          <DialogDescription>
            Illustrative photography. Actual apartments and finishes vary.
          </DialogDescription>
          {active !== null && (
            <>
              <div className="gallery-full">
                <Image
                  src={images[active].src}
                  alt={images[active].alt}
                  fill
                  sizes="90vw"
                />
              </div>
              <div className="gallery-controls">
                <Button
                  variant="outline"
                  onClick={() => move(-1)}
                  aria-label="Previous photo"
                >
                  <ArrowLeft />
                </Button>
                <p aria-live="polite">
                  {active + 1} / {images.length}
                </p>
                <Button
                  variant="outline"
                  onClick={() => move(1)}
                  aria-label="Next photo"
                >
                  <ArrowRight />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
