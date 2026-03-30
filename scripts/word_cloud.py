from wordcloud import WordCloud
import pandas as pd
import matplotlib.pyplot as plt

with open("./course_codes.nlsv") as file:
    codes = [x.rstrip().lower() for x in file.readlines()]

df = pd.read_csv("./searched-words-lower.csv")

# Filter for only 3-letter words
df_3_letter = df[df["word"].str.len() == 3]

df_3_letter = df[(df["word"].str.len() == 3) & (df["word"].isin(codes))]

freqs = dict(zip(df_3_letter["word"], df_3_letter["word_count"]))
wc = WordCloud(width=800, height=400, background_color="white")
wc.generate_from_frequencies(freqs)
plt.imshow(wc, interpolation="bilinear")
plt.axis("off")
plt.show()
