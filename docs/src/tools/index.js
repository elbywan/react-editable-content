/* eslint-disable no-unused-vars, react/jsx-no-undef, react/prop-types */

function extractPosition(event) {
    if(event instanceof MouseEvent) {
        return { x: event.clientX, y: event.clientY }
    } else if(window['TouchEvent'] && event instanceof TouchEvent) {
        return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
    } else {
        return {
            x: event['clientX'] ? event['clientX'] : event['changedTouches'][0].clientX,
            y: event['clientY'] ? event['clientY'] : event['changedTouches'][0].clientY
        }
    }
}

function getCaret(event) {
    let range: Range, offset: number, node: Node

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