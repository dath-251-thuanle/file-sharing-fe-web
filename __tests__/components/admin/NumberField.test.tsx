import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NumberField } from '@/components/admin/NumberField'

function testNumberFieldRendering() {
  it('renders label and input correctly', () => {
    render(
      <NumberField 
        label="Test Label" 
        onChange={jest.fn()} 
      />
    )
    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })
}

function testNumberFieldDescription() {
  it('renders description when provided', () => {
    render(
      <NumberField 
        label="Test Label" 
        description="Test Description"
        onChange={jest.fn()} 
      />
    )
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })
}

function testNumberFieldValueDisplay() {
  it('displays the correct value', () => {
    render(
      <NumberField 
        label="Test Label" 
        value={10}
        onChange={jest.fn()} 
      />
    )
    expect(screen.getByRole('spinbutton')).toHaveValue(10)
  })
}

function testNumberFieldChange() {
  it('calls onChange with the correct value', () => {
    const mockOnChange = jest.fn()
    render(
      <NumberField 
        label="Test Label" 
        onChange={mockOnChange} 
      />
    )
    
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '20' } })
    expect(mockOnChange).toHaveBeenCalledWith(20)
  })
}

function testNumberFieldEmptyChange() {
    it('calls onChange with undefined when empty', () => {
      const mockOnChange = jest.fn()
      render(
        <NumberField 
          label="Test Label" 
          value={10}
          onChange={mockOnChange} 
        />
      )
      
      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '' } })
      expect(mockOnChange).toHaveBeenCalledWith(undefined)
    })
  }

function testNumberFieldMinAttribute() {
  it('respects the min attribute', () => {
    render(
      <NumberField 
        label="Test Label" 
        min={5}
        onChange={jest.fn()} 
      />
    )
    expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '5')
  })
}

describe('NumberField Component', () => {
  testNumberFieldRendering()
  testNumberFieldDescription()
  testNumberFieldValueDisplay()
  testNumberFieldChange()
  testNumberFieldEmptyChange()
  testNumberFieldMinAttribute()
})
