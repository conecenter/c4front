import React from 'react';
import { CSSProperties, FC, memo } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import {ExampleItemTypes} from "./container";

const style: CSSProperties = {
  border: '1px dashed gray',
  padding: '0.5rem 1rem',
  marginBottom: '.5rem',
  backgroundColor: 'white',
}

export interface CardProps {
  id: string
  text: string
  moveCard: (id: string, to: number) => void
  findCard: (id: string) => { index: number }
}

interface Item {
  id: string
  originalIndex: number
}

export const Card: FC<CardProps> = memo(function Card({
                                                        id,
                                                        text,
                                                        moveCard,
                                                        findCard,
                                                      }) {
  const originalIndex = findCard(id).index
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ExampleItemTypes.CARD,
      item: { id, originalIndex, "test":"test" },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        const { id: droppedId, originalIndex } = item
        const didDrop = monitor.didDrop()
        if (!didDrop) {
          moveCard(droppedId, originalIndex)
        }
      },
    }),
    [id, originalIndex, moveCard],
  )

  const [, drop] = useDrop(
    () => ({
      accept: ExampleItemTypes.CARD,
      canDrop: () => false,
      hover({ id: draggedId }: Item) {
        if (draggedId !== id) {
          const { index: overIndex } = findCard(id)
          moveCard(draggedId, overIndex)
        }
      },
    }),
    [findCard, moveCard],
  )

  const dragStyle = isDragging ? {
    opacity: 0,
    cursor: "move"
  } : {}
  return (
    <div ref={(node) => drag(drop(node))} style={{ ...style, ...dragStyle }} onClick={() => console.log("click")}>
      {text}
    </div>
  )
})
