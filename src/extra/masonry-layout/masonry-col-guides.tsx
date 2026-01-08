import React from "react";

export function MasonryColGuides({ cols }: { cols: number }) {
  return (
    <div className="masonryColGuides">
      {Array.from({ length: cols }, (_, i) => (
        <div
          key={`col-guide-${i}`}
          className="masonryColGuide"
          style={{ left: `${(100 / cols) * i}%` }}
        />
      ))}
    </div>
  );
}