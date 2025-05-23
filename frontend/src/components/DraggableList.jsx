import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

function DraggableList({ listKey, items, handleDragEnd, handleRemoveListItem }) {
    return (
        <DragDropContext onDragEnd={(result) => handleDragEnd(result, listKey)}>
            <Droppable droppableId={`${listKey}-list`}>
                {(provided) => (
                    <ul 
                        className='added'
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        {items?.length > 0 ? (
                        <>
                            {items.slice(0, 3).map((item, index) => (
                                <Draggable key={item.name || item} draggableId={item.name || item} index={index}>
                                    {(provided) => (
                                    <li 
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps} 
                                        className='draggable'
                                    >
                                        <span>
                                        {item.name || item}
                                        {item.level && item.level !== 'Level' ? ` - ${item.level}` : ''}
                                        </span>
                                        <i 
                                        className='fa-solid fa-xmark' 
                                        onClick={() => handleRemoveListItem(listKey, index)}
                                        ></i>
                                    </li>
                                    )}
                                </Draggable>
                                ))}

                                {items.length > 3 && (
                                <li className='more-items'>+{items.length - 3}</li>
                            )}
                        </>
                        ) : (
                            <p>No {listKey} added yet.</p>
                        )}
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    )
}

export default DraggableList