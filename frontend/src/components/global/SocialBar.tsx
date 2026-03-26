// Phase 5: Reviews & Social
import { useEffect, useState } from "react";

export default function SocialBar() {
  const [socials, setSocials] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch connected social accounts
    fetch("/api/social/accounts", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("auth_token")}` }
    })
      .then(r => r.json())
      .then(data => setSocials(data))
      .catch(() => {});
  }, []);

  const socList = [
    { id: 'whatsapp', icon: '💬', url: socials.whatsapp ? `wa.me/${socials.whatsapp}` : null },
    { id: 'instagram', icon: '📸', url: socials.instagram ? `instagram.com/${socials.instagram}` : null },
    { id: 'facebook', icon: '👥', url: socials.facebook ? `facebook.com/${socials.facebook}` : null },
    { id: 'tiktok', icon: '🎵', url: socials.tiktok ? `tiktok.com/@${socials.tiktok}` : null },
    { id: 'pinterest', icon: '📌', url: socials.pinterest ? `pinterest.com/${socials.pinterest}` : null },
  ];

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {socList.map(soc => (
        <a
          key={soc.id}
          href={soc.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 18,
            opacity: soc.url ? 1 : 0.3,
            cursor: soc.url ? 'pointer' : 'default',
            textDecoration: 'none',
          }}
          title={soc.id}
        >
          {soc.icon}
        </a>
      ))}
    </div>
  );
}
