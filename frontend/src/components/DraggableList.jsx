import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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
                            items.map((item, index) => (
                                <Draggable key={item.name || item} draggableId={item.name || item} index={index}>
                                    {(provided) => (
                                        <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className='draggable'>
                                            <span>
                                                {item.name || item}
                                                {/* For skills with level */}
                                                {item.level && item.level !== 'Level' ? ` - ${item.level}` : ''}
                                            </span>
                                            <i className='fa-solid fa-xmark' onClick={() => handleRemoveListItem(listKey, index)}></i>
                                        </li>
                                    )}
                                </Draggable>
                            ))
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