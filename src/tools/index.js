export function getTextOffset(refNode, anchorNode, anchorOffset) {
    const selection = document.getSelection()
    const backupRange = selection.rangeCount > 0 && selection.getRangeAt(0)
    const range = document.createRange()
    range.setStart(refNode, 0)
    range.setEnd(anchorNode, anchorOffset)
    selection.removeAllRanges()
    selection.addRange(range)
    const length = selection.toString().length
    selection.removeAllRanges()
    if(backupRange)
        selection.addRange(backupRange)
    return length
}

export function getNodeAtOffset(parentNode, textOffset) {
    const getNext = (node, offset) => {
        if((node.innerText || node.textContent).length >= offset) {
            const children = node.childNodes
            if(children.length < 1)
                return { node, offset }
            let offsetTemp = offset
            let child
            for(let i = 0; i < children.length; i++) {
                child = children[i]
                if((child.innerText || child.textContent).length >= offsetTemp)
                    break
                offsetTemp = offsetTemp - (child.innerText || child.textContent).length
            }
            return { node: child, offset: offsetTemp }
        } else {
            return { node: null, offset }
        }
    }

    let current = getNext(parentNode, textOffset)

    while(current.node && (current.node.nodeType !== 3 && current.node.childNodes.length > 0)) {
        current = getNext(current.node, current.offset)
    }

    return current
}

export function collapseRangeAt(node, offset) {
    try {
        document.getSelection().removeAllRanges()
        const range = document.createRange()
        range.setStart(node, offset)
        range.setEnd(node, offset)
        document.getSelection().addRange(range)
    } catch(e) {
        // silent
    }
}

/**
 * Extract a mouse or touch position.
 */
export function extractPosition(event) {
    if(event instanceof MouseEvent) {
        return { x: event.clientX, y: event.clientY}
    } else if(window['TouchEvent'] && event instanceof TouchEvent) {
        return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
    } else {
        return {
            x: event['clientX'] ? event['clientX'] : event['changedTouches'][0].clientX,
            y: event['clientY'] ? event['clientY'] : event['changedTouches'][0].clientY
        }
    }
}

/**
 * Cross browser caret retrieveal @ mouse position.
 */
export function getCaret(event) {
    let range, offset, node

    let x, y = 0
    if(!event['x']) {
        const pos = extractPosition(event)
        x = pos.x
        y = pos.y
    } else {
        x = event['x']
        y = event['y']
    }

    if(document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y)
        node = range.startContainer
        offset = range.startOffset
    } else if(document['caretPositionFromPoint']) {
        const position = document['caretPositionFromPoint'](x, y)
        node = position['offsetNode']
        offset = position['offset']
        range = document.createRange()
        range.setStart(node, offset)
        range.setEnd(node, offset)
    }

    return { range, offset, node }
}