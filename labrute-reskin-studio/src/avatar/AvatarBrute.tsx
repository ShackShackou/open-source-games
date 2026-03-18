import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { Symbol475 } from '../../export/Symbol475';

export interface AvatarBruteProps {
  skin?: number;
  weapon?: { paths: string };
}

export default function AvatarBrute({ skin = 0xffc8b0, weapon }: AvatarBruteProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({ width: 300, height: 400, backgroundAlpha: 0 });
    if (container.current) {
      container.current.innerHTML = '';
      container.current.appendChild(app.view as unknown as Node);
    }

    const brute = new PIXI.Container();
    const body = PIXI.Sprite.from(Symbol475.paths);
    body.tint = skin;
    brute.addChild(body);

    if (weapon) {
      const weaponSprite = PIXI.Sprite.from(weapon.paths);
      brute.addChild(weaponSprite);
    }

    brute.position.set(150, 200);
    app.stage.addChild(brute);
    return () => app.destroy(true, { children: true });
  }, [skin, weapon]);

  return <div ref={container} />;
}
