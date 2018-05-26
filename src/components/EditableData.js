import React, { PureComponent } from 'react'
import { EditableContent } from './EditableContent'
import { getTextOffset } from '../tools'
import PropTypes from 'prop-types'

export class EditableData extends PureComponent {

    static propTypes = {
        data: PropTypes.object.isRequired,
        onChange: PropTypes.func.isRequired,
        renderDataItem: PropTypes.func.isRequired,
        helperRef: PropTypes.func

    }

    componentDidMount() {
        const { helperRef } = this.props

        helperRef(new DataHelper(this))
    }

    getDataNode(targetNode) {
        let parent = targetNode
        while(parent && (!parent.dataset || !parent.dataset.nodeIndex))
            parent = parent.parentElement
        return parent
    }

    update = () => {
        const { data, onChange } = this.props

        const nodes = Array.from(this._ref.querySelectorAll('[data-node]'))

        if(nodes.length === 0 || nodes.length === 1 && !nodes[0].innerText) {
            return onChange([{ text: this._ref.innerText }])
        }

        const newDataMap = nodes.reduce((acc, node) => {
            let text = node.innerText
            const parentNode = node.parentElement
            const nodeIndex = node.dataset.nodeIndex

            if(
                parentNode.nodeType === 1 &&
                parentNode !== this._ref &&
                getComputedStyle(parentNode).display === 'block' &&
                !node.previousSibling
            ) {
                text = '\n' + text
            }

            const datum = {
                ...data[nodeIndex] || {},
                text
            }

            if(acc.has(nodeIndex)) {
                let text = acc.get(nodeIndex).text
                if(text.endsWith('\n') && datum.text.startsWith('\n')) {
                    text += datum.text.substring(1)
                } else {
                    text += datum.text
                }
                acc.set(nodeIndex, {
                    ...datum,
                    text
                })
            } else {
                acc.set(nodeIndex, datum)
            }

            return acc
        }, new Map())

        const newData =
            Array.from(newDataMap)
                .sort(([a], [b]) => a - b)
                .map(([ , val ]) => {
                    delete val.nodeIndex
                    return val
                })
                .filter(item => item.text !== '\n')

        onChange(newData)
    }

    renderDataList = data => {
        const { renderDataItem } = this.props

        if(!data.length) {
            return <span key={0} data-node data-node-index={0}><br/></span>
        }

        return data.map((item, index) =>
            <span key={index} data-node data-node-index={index}>
                { renderDataItem(item, index) }
            </span>
        )
    }

    render() {
        // eslint-disable-next-line
        const { data, className, renderDataItem, helperRef, ...rest } = this.props

        const dataText = data.map(_ => _.text).join('')

        return (
            <EditableContent
                className={ className }
                onInput={ this.update }
                uniqueKey={ dataText }
                ref={ ref => this._ref = ref && ref._elementRef }
                { ...rest }
            >
                { this.renderDataList(data) }
            </EditableContent>
        )
    }
}

class DataHelper  {

    constructor(componentInstance) {
        this.componentInstance = componentInstance
    }

    static updateNodes(data, targets, updateFunction) {
        return data.reduce((acc, item, index) => {
            const matchingTarget = targets.find(t => t.index === index)

            if(!matchingTarget) {
                acc.push(item)
            } else {
                if(matchingTarget.startOffset) {
                    acc.push({
                        ...item,
                        text: item.text.substring(0, matchingTarget.startOffset)
                    })
                }
                acc.push({
                    ...updateFunction(item, matchingTarget, index, targets),
                    text: item.text.substring(matchingTarget.startOffset || 0, matchingTarget.endOffset || item.text.length)
                })
                if(matchingTarget.endOffset) {
                    acc.push({
                        ...item,
                        text: item.text.substring(matchingTarget.endOffset)
                    })
                }
            }
            return acc
        }, [])
    }

    static defaultMerge(a, b) {
        if(Object.keys(a).length !== Object.keys(b).length)
            return false
        return Object.keys(a).every(key => key === 'text' ? true : a[key] === b[key])
    }

    // Public

    cleanNodes(nodes, mergeFunction = DataHelper.defaultMerge) {
        return nodes
            .filter(elt => !!elt && !!elt.text)
            .reduce((acc, elt) => {
                const previousElt = acc.length && acc[acc.length - 1]
                if(mergeFunction(previousElt, elt)) {
                    previousElt.text += elt.text
                } else {
                    acc.push(elt)
                }
                return acc
            }, [])
    }

    getRef() {
        return this.componentInstance._ref
    }

    /**
     * Retrieves selected data nodes.
     */
    getSelection(expandWhenCollapsed = true) {
        const { _ref, props: { data }} = this.componentInstance

        const selection = document.getSelection()

        if(!selection.rangeCount)
            return

        const range = document.getSelection().getRangeAt(0)

        if(!_ref.contains(range.startContainer) || !_ref.contains(range.endContainer))
            return

        const selectionText = selection.toString()
        let dataNode = range.startContainer

        while(dataNode && (!dataNode.dataset || !dataNode.dataset.nodeIndex)) {
            dataNode = dataNode.parentElement
        }

        if(!dataNode)
            return

        const backupRange = range.cloneRange()

        const startOffset = getTextOffset(dataNode, range.startContainer, range.startOffset)
        const endOffset = range.endOffset + startOffset - range.startOffset

        selection.addRange(backupRange)

        if(range.startContainer === range.endContainer || range.startContainer.contains(range.endContainer)) {
            const index = parseInt(dataNode.dataset.nodeIndex, 10)
            const doExpand = expandWhenCollapsed && range.collapsed

            return [{
                index,
                text: doExpand ? dataNode.innerText : selectionText,
                startOffset: doExpand ? null : startOffset,
                endOffset: doExpand ? null : endOffset,
                dataItem: data[index]
            }]
        } else {
            const rangeNodes = range.cloneContents()
            const dataNodes = Array.from(rangeNodes.querySelectorAll('[data-node]'))

            return dataNodes.map((node, index) => ({
                index: parseInt(node.dataset.nodeIndex, 10),
                text: node.innerText,
                startOffset: index === 0 ? startOffset : null,
                endOffset: index === dataNodes.length - 1 ? endOffset : null,
                dataItem: data[parseInt(node.dataset.nodeIndex, 10)]
            })).filter(_ => _.text && (_.endOffset === null || _.endOffset > 0))
        }
    }
    /**
     * Updates all the data nodes currently selected.
     *
     * @param {*} updateFunction - Properties to update in the selected data items.
     * @param {*} mergeFunction - Optional, specifies how to merge neighbours into a single item (usually when their properties are similar)
     */
    applyToSelection(updateFunction, mergeFunction, { expandWhenCollapsed = true } = {}) {
        const { props: { data }} = this.componentInstance

        const targets = this.getSelection(expandWhenCollapsed)

        if(!targets || !targets.length)
            return

        return this.cleanNodes(
            DataHelper.updateNodes(data, targets, updateFunction),
            mergeFunction
        )
    }
}