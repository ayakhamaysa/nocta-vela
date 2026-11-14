# NOCTA VELA — 3D Car Launch & Configurator

A cinematic launch page for a fictional all-electric grand tourer.

- **Film-like scroll:** the camera moves between shots: hero, side profile, night light signature, low rear, cabin with butterfly doors open, configurator, reservation.
- **Live configurator:** paint (gloss and matte), roof & mirrors, wheel finish, brake calipers and interior, all combinable, with a live price.
- **Showroom:** reflective floor, studio light strips, real headlight beams at night, doors and lights toggles, drag to turn.
- Dark / light showroom switch, WhatsApp reservation with the full build.

**Built with:** React, Three.js, React Three Fiber, drei, Framer Motion, Tailwind CSS, Vite.

## Credits
- 3D car model: "Car Concept" by Eric Chadwick / Darmstadt Graphics Group, based on a public-domain model by Unity Fan. Licensed CC BY 4.0. Source: KhronosGroup/glTF-Sample-Assets. Logos on the plate and steering wheel are hidden.
- NOCTA and VELA are fictional names for a portfolio concept.

## Run it
```
npm install
npm run dev
```

## Edit
- Choices, prices, WhatsApp number: `src/data/car.js`
- Texts: `src/data/ui.js`
- Camera shots and mood per section: `src/components/Stage.jsx` (SHOTS)
- Materials, doors and lights: `src/components/Car.jsx`

Made by [One Click](https://www.instagram.com/oneclick.ps)
