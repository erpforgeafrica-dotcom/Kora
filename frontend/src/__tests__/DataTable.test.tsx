import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '../components/ui/DataTable';

const mockData = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
];

const mockColumns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' }
];

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('triggers onRowClick when row is clicked', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={mockColumns} data={mockData} onRowClick={onRowClick} />);
    
    fireEvent.click(screen.getByText('John Doe'));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('shows empty state when no data', () => {
    render(<DataTable columns={mockColumns} data={[]} />);
    
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});