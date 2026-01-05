import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

function testInputRendersWithLabel() {
    it('renders with label correctly', () => {
        render(<Input label="Username" />)
        expect(screen.getByText('Username')).toBeInTheDocument()
    })
}

function testInputRendersWithIcon() {
    it('renders with icon', () => {
        render(<Input icon={<span data-testid="icon">🔍</span>} />)
        expect(screen.getByTestId('icon')).toBeInTheDocument()
    })
}

function testInputDisplaysErrorMessage() {
    it('displays error message', () => {
        render(<Input error="Invalid input" />)
        expect(screen.getByText('Invalid input')).toBeInTheDocument()
        expect(screen.getByRole('textbox')).toHaveClass('border-red-500')
    })
}

function testInputHandlesChange() {
    it('handles input changes', () => {
        const handleChange = jest.fn()
        render(<Input onChange={handleChange} />)
        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'test' } })
        expect(handleChange).toHaveBeenCalled()
    })
} 

describe('Input Component', () => {
    testInputRendersWithLabel()
    testInputRendersWithIcon()
    testInputDisplaysErrorMessage()
    testInputHandlesChange()
})
