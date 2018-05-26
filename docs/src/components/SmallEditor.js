/* global React, EditableData */
/* eslint-disable no-unused-vars, react/jsx-no-undef, react/prop-types */

const editorButtons = [
    [ 'Bold', 'fa-bold', 'bold' ],
    [ 'Italic', 'fa-italic', 'italic' ],
    [ 'Highlight', 'fa-pencil-alt', 'highlight', () => prompt('Color code ?', '#FC6') ],
    [ 'Link', 'fa-link', 'link' ],
    [ 'Align left', 'fa-align-left', 'align', 'left' ],
    [ 'Align right', 'fa-align-right', 'align', 'right' ],
    [ 'Align center', 'fa-align-center', 'align', 'center' ],
    [ 'Justify', 'fa-align-justify', 'align', 'justify' ],
    [ 'H1', 'fa-heading', 'heading', 'h1' ],
    [ 'H2', 'fa-heading', 'heading', 'h2' ],
    [ 'H3', 'fa-heading', 'heading', 'h3' ],
    [ 'H4', 'fa-heading', 'heading', 'h4' ],
    [ 'H5', 'fa-heading', 'heading', 'h5' ],
    [ 'H6', 'fa-heading', 'heading', 'h6' ],
    [ 'Remove styles', 'fa-minus-circle' ],
    [ 'Undo', 'fa-undo', null, null, function() {
        this.undo()
    } ],
    [ 'Redo', 'fa-redo', null, null, function() {
        this.redo()
    } ]
]

const actionOnKey = function(event) {
    if(!event.getModifierState('Meta') && !event.getModifierState('Control'))
        return false

    switch (event.key) {
        case 'b':
            this.applyStyle('bold')
            event.preventDefault()
            break
        case 'i':
            this.applyStyle('italic')
            event.preventDefault()
            break
        case 'z':
            this.undo()
            break
        case 'Z':
            this.redo()
            break
    }
}

class SmallEditor extends React.PureComponent {

    state = {
        editorData: [],
        undoStack: [],
        undoStackPointer: null
    }

    keyListener = function(event) {
        return actionOnKey.bind(this)(event)
    }

    componentDidMount() {
        this.updateEditorData([{
            text: 'Lorem ipsum dolor sit amet, bibendum tellus dictumst, non auctor at quis quis, non pariatur vel lacus fermentum sem lacus, erat gravida in pulvinar, eget non. Tempor libero odio ac, et gravida, nunc ornare lorem dictum aliquet donec proin.\n\nNulla est cras urna nibh posuere, repellendus sed congue nec magna dignissim, etiam nulla commodo vivamus mauris pellentesque pellentesque. Cursus mi sollicitudin cursus, vestibulum et enim purus sed purus.\n\nCurabitur facilisis ante, pulvinar diam erat risus nulla vel, natoque mattis aliquam sed convallis, sed ut pharetra aenean, lacinia pretium sint.'
        }])
        this.keyListener = this.keyListener.bind(this)
        this._topElement.addEventListener('keydown', this.keyListener)
    }

    componentWillUnmount() {
        this._topElement.removeEventListener('keydown', this.keyListener)
    }

    updateEditorData(newData, skipStackUpdate = false) {
        const { undoStack, undoStackPointer } = this.state

        const stackValues = {
            undoStack: [],
            undoStackPointer: 0
        }

        if(!skipStackUpdate) {
            if(undoStackPointer !== null) {
                stackValues.undoStack = undoStack.slice(0, undoStackPointer + 1)
                stackValues.undoStackPointer = undoStackPointer + 1
            }
            stackValues.undoStack.push(newData)
        }

        this.setState({
            editorData: newData,
            ...stackValues
        })
    }

    getEditorData() {
        const { undoStack, undoStackPointer, editorData } = this.state

        if(undoStackPointer !== null) {
            return undoStack[undoStackPointer]
        } else {
            return editorData
        }
    }

    renderDataItem = (item, idx) => {
        const { text, bold, italic, highlight, align, link, heading: Heading } = item

        const style = {}

        if(bold)
            style.fontWeight = 'bold'
        if(italic)
            style.fontStyle = 'italic'
        if(highlight)
            style.backgroundColor = highlight
        if(align) {
            style.textAlign = align
            style.display = 'block'
        }

        if(link) {
            return (
                <a style={style} contentEditable={false} href={text} target="_blank">
                    <span contentEditable={true} suppressContentEditableWarning>{text}</span>
                </a>
            )
        }
        if(Heading) {
            return <Heading style={style}>{ text }</Heading>
        }

        return <span key={ idx } style={style}>{ text }</span>
    }

    dataChange = editorData => this.updateEditorData(editorData)

    applyStyle = (property, value) => {
        const { editorData } = this.state

        if(typeof value === 'function')
            value = value()

        const newData = this.dataHelper.applyToSelection((item, target, index, targets) => {
            if(!property) {
                return {
                    text: item.text
                }
            }

            const styleState =
                value !== undefined ?
                    !targets.every(target => editorData[target.index][property] === value) ?
                        value :
                    false :
                !targets.every(target => editorData[target.index][property])

            const newItem = {
                ...item,
                [property]: styleState
            }

            if(!styleState)
                delete newItem[property]

            return newItem
        })

        if(newData)
            this.updateEditorData(newData)
    }

    undo() {
        const { undoStack, undoStackPointer } = this.state
        const newPointer = Math.max(0, undoStackPointer - 1)
        this.setState({
            editorData: undoStack[newPointer],
            undoStackPointer: newPointer
        })
    }

    redo() {
        const { undoStack, undoStackPointer } = this.state
        const newPointer = Math.min(undoStack.length - 1, undoStackPointer + 1)
        this.setState({
            editorData: undoStack[newPointer],
            undoStackPointer: newPointer
        })
    }

    updateCurrentStyle = selection => {
        const currentSelection = this.dataHelper.getSelection()
        this.setState({ currentSelection })
    }

    setDataHelper = dataHelper => {
        this.dataHelper = dataHelper
    }

    render() {
        const { placeholder = 'Enter some text here ...' } = this.props
        const { disabled, currentSelection } = this.state

        const editorData = this.getEditorData()

        const buttons = editorButtons.map(([ label, icon, property, value, action ]) => {
            const isActive =
                currentSelection &&
                currentSelection[0] &&
                currentSelection[0].dataItem &&
                (typeof value === 'function' ?
                    currentSelection[0].dataItem[property] :
                    currentSelection[0].dataItem[property] === (value !== undefined ? value : true))

            return <button
                key={label}
                className={ isActive ? 'active' : '' }
                onClick={event => action ? action.bind(this)(event) : this.applyStyle(property, value)}
            >
                { icon && <i className={ 'fas ' + icon } style={{ marginRight: '1em' }}></i> }
                { label }
            </button>
        })

        const displayPlaceholder =
            editorData.length < 1 ||
            editorData.length === 1 && (!editorData[0].text || editorData[0].text === '\n')

        return (
            <div style={{ textAlign: 'left' }} ref={ref => this._topElement = ref}>
                <pre style={{ display: 'inline-block', margin: '20px', fontSize: '0.8em', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                    { JSON.stringify(this.state.editorData, null) }
                </pre>
                <div className="small-editor-container">
                    <div className="small-editor-buttons-bar">
                        { buttons }
                        <button onClick={ _ => this.setState({ disabled: !disabled })}>
                            { disabled ? 'Enable edition' : 'Disable edition' }
                        </button>
                    </div>
                    <div className="small-editor">
                        {
                            displayPlaceholder &&
                            <div className="small-editor-placeholder">{ placeholder } </div>
                        }
                        <EditableData
                            className="App-intro"
                            data={ editorData }
                            helperRef={ this.setDataHelper }
                            onChange={ this.dataChange }
                            renderDataItem={ this.renderDataItem }
                            onSelect={ this.updateCurrentStyle }
                            disabled={ this.state.disabled }
                        />
                    </div>
                </div>
            </div>
        )
    }
}