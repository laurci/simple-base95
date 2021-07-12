# BASE 95

Basic (and poorly optimized) implementation of an encoder/decoder in a custom alphabet that contains all the printable characters in ASCII. The implementation is based on bitconin's base58 encoding. The alogrithm can work with any alphabet that contains less than 255 characters. For base95, the encoded output is about 7% bigger on average than the input.

# Why?

@alex.ifrim :)

# How it works?

We encode byte arrays by doing divisions on all digits in the input bugger (this way we create a representation of that number in the desired base). For every leading 0 in the buffer we encode as a single leader character (it is chosed as the first character from the alphabet and is decoded as 8 bits). Every other charater depend on the base.

# What's next?

Maybe optimize this implementation to get more performance. Make it async? Parallelize it? Do all of that and write in as Node native extension in Rust? Or... Nothing :) Up to you.
