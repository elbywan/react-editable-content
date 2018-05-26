import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
    getTextOffset,
    getNodeAtOffset,
    collapseRangeAt
} from '../tools'

export class EditableContent extends Component {

    static propTypes = {
        children: PropTypes.node,
        element: PropTypes.string,
        uniqueKey: PropTypes.string,
        disabled: PropTypes.bool
    }

    getSnapshotBeforeUpdate() {
        const selection = document.getSelection()

        if(
            !this._elementRef ||
            !selection.rangeCount ||
            !this._elementRef.contains(selection.anchorNode)
        ) {
            return {}
        }

        const caretPosition = getTextOffset(
            this._elementRef,
            selection.anchorNode,
            selection.anchorOffset
        )

        const caretPositionEnd =
            this._elementRef.contains(selection.focusNode) &&
            getTextOffset(
                this._elementRef,
                selection.focusNode,
                selection.focusOffset
            )

        return {
            caretPosition,
            caretPositionEnd
        }
    }

    componentDidUpdate(prevProps, prevState, { caretPosition, caretPositionEnd }) {
        if(!this._elementRef || typeof caretPosition !== 'number')
            return

        const { node, offset } = getNodeAtOffset(this._elementRef, caretPosition)

        // console.log(node, offset)

        if(!node)
            return

        if(!caretPositionEnd)
            return collapseRangeAt(node, offset)

        const { node: nodeEnd, offset: offsetEnd } = getNodeAtOffset(this._elementRef, caretPositionEnd)

        if(!nodeEnd)
            return collapseRangeAt(node, offset)

        document.getSelection().removeAllRanges()
        const range = document.createRange()
        range.setStart(node, offset)
        range.setEnd(nodeEnd, offsetEnd)
        document.getSelection().addRange(range)
    }

    setRef = ref => {
        this._elementRef = ref
    }

    onPaste = event => {
        event.preventDefault()

        const { clipboardData } = event

        if(!clipboardData.types.includes('text/plain'))
            return

        const pastedText = clipboardData.getData('text/plain')
        document.execCommand('insertText', false, pastedText)
    }

    render() {
        const { children, element, uniqueKey, disabled, ...rest } = this.props
        const Element = element || 'div'

        return (
            <Element
                ref={ this.setRef }
                contentEditable={ !disabled }
                suppressContentEditableWarning
                key={ uniqueKey || Math.random() }
                onPaste={ this.onPaste }
                style={{ whiteSpace: 'pre-wrap' }}
                { ...rest }
            >
                { children }
            </Element>
        )
    }
}