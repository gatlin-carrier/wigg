import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export default function HeaderSearch() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  function go(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={go} className="hidden md:block">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search movies, TV, books…"
        className="w-80"
      />
    </form>
  );
}

