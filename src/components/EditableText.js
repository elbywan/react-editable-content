import React, { PureComponent } from 'react'
import { EditableContent } from './EditableContent'
import PropTypes from 'prop-types'

export class EditableText extends PureComponent {

    static propTypes = {
        text: PropTypes.string.isRequired,
        render: PropTypes.func.isRequired,
        className: PropTypes.string,
        onChange: PropTypes.func
    }

    update = event => {
        const { onChange } = this.props
        onChange(event.target.innerText)
    }

    render() {
        const { text, render, className, ...rest } = this.props

        const uniqueKey = text.length

        return (
            <EditableContent
                className={ className }
                onInput={ this.update }
                uniqueKey={uniqueKey}
                { ...rest }
            >
                { render(text) }
            </EditableContent>
        )
    }
}