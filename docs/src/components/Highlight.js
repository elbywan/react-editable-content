/* eslint-disable no-unused-vars, react/jsx-no-undef, react/prop-types */

window.Highlight = ({ color, children, resize, isResizing, ...rest }) =>
    <span className="highlight-container" style={{ background: color || 'yellow' }} { ...rest }>
        {
            resize &&
            <span
                className={
                    'highlight-expander highlight-expander-start' +
                    (isResizing && isResizing.start ? ' highlight-expander-active' : '')
                }
                onMouseDown={ resize }
            />
        }
        { children }
        {
            resize &&
            <span
            className={
                'highlight-expander highlight-expander-end' +
                (isResizing && !isResizing.start ? ' highlight-expander-active' : '')
            }
                onMouseDown={ resize }
            />
        }
    </span>
window.Highlight.displayName = 'Highlight'