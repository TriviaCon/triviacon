const Logo: React.FC = () => {
  return (
    <h4 className="text-center text-xl mb-0 select-none">
      <span className="text-foreground">Trivia</span>
      <span
        className="font-bold"
        style={{
          background:
            'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        CON
      </span>
    </h4>
  )
}

export default Logo
