import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

function testButtonRendersChildren() {
    it('renders children correctly', () => {
        render(<Button>Click Me</Button>)
        expect(screen.getByText('Click Me')).toBeInTheDocument()
    })
}

function testButtonVariantClasses() {
    it('applies variant classes correctly', () => {
        render(<Button variant="danger">Delete</Button>)
        const button = screen.getByText('Delete')
        expect(button).toHaveClass('bg-red-600')
    })
}

function testButtonLoadingState() {
    it('shows loading text when loading is true', () => {
        render(<Button loading>Submit</Button>)
        expect(screen.getByText('Đang xử lý...')).toBeInTheDocument()
        expect(screen.getByRole('button')).toBeDisabled()
    })
}

function testButtonOnClick() {
    it('calls onClick handler when clicked', () => {
        const handleClick = jest.fn()
        render(<Button onClick={handleClick}>Click Me</Button>)
        fireEvent.click(screen.getByText('Click Me'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })
}

function testButtonDisabledOnClick() {
    it('does not call onClick when disabled', () => {
        const handleClick = jest.fn()
        render(<Button disabled onClick={handleClick}>Click Me</Button>)
        fireEvent.click(screen.getByText('Click Me'))
        expect(handleClick).not.toHaveBeenCalled()
    })
}

describe('Button Component', () => {
    testButtonRendersChildren()
    testButtonVariantClasses()
    testButtonLoadingState()
    testButtonOnClick()
    testButtonDisabledOnClick()
})
