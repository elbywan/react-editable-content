/* global React, ReactEditableContent, Highlight, getCaret */
/* eslint-disable no-unused-vars, react/jsx-no-undef, react/prop-types */

const { PureComponent } = React
const { EditableData } = ReactEditableContent

class DataExample extends PureComponent {

    state = {
        data: [
            {
                text: 'I',
                highlighted: '#b0e5fd'
            },
            {
                text: ' would like to '
            },
            {
                text: 'drink',
                highlighted: '#ffa2a2'
            },
            {
                text: ' some '
            },
            {
                text: 'water',
                highlighted: '#ffeb3b'
            },
            {
                text: '.'
            }
        ]
    }

    highlightSelection = () => {
        const { data } = this.state

        const newData = this.dataHelper.applyToSelection((item, target, index, targets) => {
            const highlightState = !targets.every(target => data[target.index].highlighted === '#ffeb3b') && '#ffeb3b'

            return highlightState ? {
                highlighted: highlightState
            } : {}
        })

        if(newData)
            this.setState({ data: newData })
    }

    renderDataItem = ({ text, highlighted }, idx) =>
        highlighted ?
            <Highlight
                key={idx}
                color={highlighted}
                resize={this.startResizing}
                isResizing={this.state.resizingData && this.state.resizingData.index === idx && this.state.resizingData}>
                {text}
            </Highlight> :
            <span key={idx}>{text}</span>

    dataChange = data => this.setState({ data })

    /* Highlight resizing */

    componentDidMount() {
        // Add global listeners which will end resizing if triggered
        document.addEventListener('mouseup', this.stopResizing.bind(this))
    }

    componentWillUnmount() {
        // Cleanup global listeners
        document.removeEventListener('mouseup', this.stopResizing.bind(this))
    }

    startResizing = event => {
        const start = event.target.classList.contains('highlight-expander-start')
        let dataNode = event.target
        while(dataNode && (!dataNode.dataset || dataNode.dataset.nodeIndex === undefined)) {
            dataNode = dataNode.parentElement
        }

        this.setState({
            resizingData: {
                start,
                index: parseInt(dataNode.dataset.nodeIndex, 10)
            }
        })
    }

    stopResizing = event => {
        if(this.state.resizingData)
            this.setState({
                data: this.dataHelper.cleanNodes(this.state.data),
                resizingData: null
            })
    }

    resizeHighlight = event => {
        if(!this.state.resizingData)
            return null

        const { start } = this.state.resizingData
        let { index } = this.state.resizingData

        const data = this.state.data[index]
        const { range: caret, node } = getCaret(event)
        const selection = document.getSelection()
        const range = document.createRange()
        const dataNode = this.dataHelper.getRef().querySelector(`[data-node-index='${index}']`)

        if(start) {
            if(
                dataNode.contains(node) ||
                dataNode.previousSibling &&
                dataNode.previousSibling.contains(node)
            ) {
                range.setStart(caret.startContainer, caret.startOffset)
                range.setEndAfter(dataNode)
            } else {
                return
            }
        } else if(
            dataNode.contains(node) ||
            dataNode.nextSibling &&
            dataNode.nextSibling.contains(node)
        ) {
            range.setStart(dataNode, 0)
            range.setEnd(caret.startContainer, caret.startOffset)
        } else {
            return
        }

        if(range.toString().length < 1)
            return

        const newText = range.toString()
        const text = data.text
        const big = newText.length > text.length ? newText : text
        const small = newText.length > text.length ? text : newText
        const diff = start ? big.substring(0, big.length - small.length) : big.substring(small.length)
        const widen = big === newText

        // console.log({ big, small, diff })

        let newData = [...this.state.data]

        // Add/Remove text nodes when resizing 'border' slots
        if(!widen && start) {
            if(index === 0) {
                newData.unshift({ text: '' })
                index++
            } else if(newData[index - 1].highlighted) {
                newData.splice(index, 0, { text: '' })
                index++
            }
        } else if(!widen && !start) {
            if(index === newData.length - 1)
                newData.push({ text: '' })
            else if(newData[index + 1].highlighted)
                newData.splice(index + 1, 0, { text: '' })
        }

        newData = newData.map((datum, idx) => {
            // The modified slot
            if(idx === index) {
                return {
                    ...datum,
                    text: newText
                }
            }
            // If we used the left pin, this is the fragment on the left of the slot
            if(start && idx === index - 1) {
                const text = widen ?
                    datum.text.substring(0, datum.text.lastIndexOf(diff)) :
                    datum.text + diff
                return {
                    ...datum,
                    text
                }
            }
            // If we used the right pin, this is the fragment on the right of the slot
            if(!start && idx === index + 1) {
                const text = widen ?
                    datum.text.substring(datum.text.indexOf(diff.substring(0, datum.text.length)) + diff.length) :
                    diff + datum.text
                return {
                    ...datum,
                    text
                }
            }
            // Other fragments
            return { ...datum }
        })

        selection.removeAllRanges()

        if(newData)
            this.setState({
                data: newData,
                resizingData: {
                    ...this.state.resizingData,
                    index
                }
            })
    }


    render() {
        return (
            <div>
                <div style={{ margin: '20px' }}>
                    { JSON.stringify(this.state.data) }
                </div>
                <div style={{ margin: '20px' }}>
                    <button onClick={ this.highlightSelection }>Toggle highlight</button>
                </div>
                <EditableData
                    className="App-intro highlightable-text"
                    data={ this.state.data }
                    helperRef={ dataHelper => this.dataHelper = dataHelper }
                    onChange={ this.dataChange }
                    renderDataItem={ this.renderDataItem }
                    onMouseMove={ this.resizeHighlight }
                    onMouseLeave={ this.resizeHighlight }
                />
            </div>
        )
    }
}