## This file will basically be a stripped down version of train.py from
## the original repo, with only the model classes and make_model function.

import argparse
import torch
from torch import nn

# Classes from train.py

class CNN1DRegressor(nn.Module):
    def __init__(self, input_size: int, output_size: int, hidden_size: int, dropout: float) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(input_size, hidden_size, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Conv1d(hidden_size, hidden_size, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.head = nn.Linear(hidden_size, output_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x.transpose(1, 2)
        x = self.net(x).squeeze(-1)
        return self.head(x)


class RecurrentRegressor(nn.Module):
    def __init__(
        self,
        cell: str,
        input_size: int,
        output_size: int,
        hidden_size: int,
        num_layers: int,
        dropout: float,
        bidirectional: bool = False,
    ) -> None:
        super().__init__()
        rnn_cls = nn.LSTM if cell == "lstm" else nn.GRU
        self.rnn = rnn_cls(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
            bidirectional=bidirectional,
        )
        directions = 2 if bidirectional else 1
        self.head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden_size * directions, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, output_size),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.rnn(x)
        return self.head(out[:, -1, :])

class HybridCNNLSTM(nn.Module):
    def __init__(self, input_size: int, output_size: int, hidden_size: int, num_layers: int, dropout: float) -> None:
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(input_size, hidden_size, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Dropout(dropout),
        )
        self.lstm = nn.LSTM(
            input_size=hidden_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.head = nn.Linear(hidden_size, output_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        z = self.conv(x.transpose(1, 2)).transpose(1, 2)
        out, _ = self.lstm(z)
        return self.head(out[:, -1, :])


class EncoderDecoderRegressor(nn.Module):
    """Sequence-to-sequence LSTM decoder for multi-lead regression."""

    def __init__(self, input_size: int, output_size: int, hidden_size: int, num_layers: int, dropout: float) -> None:
        super().__init__()
        self.output_size = output_size
        self.encoder = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.decoder = nn.LSTM(
            input_size=1,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.head = nn.Linear(hidden_size, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        _, state = self.encoder(x)
        decoder_input = torch.zeros(x.size(0), self.output_size, 1, device=x.device, dtype=x.dtype)
        decoder_out, _ = self.decoder(decoder_input, state)
        return self.head(decoder_out).squeeze(-1)


# make_model function from train.py

def make_model(model_name: str, input_size: int, output_size: int, args: argparse.Namespace) -> nn.Module:
    model_name = model_name.lower()
    if model_name == "cnn1d":
        return CNN1DRegressor(input_size, output_size, args.hidden_size, args.dropout)
    if model_name == "lstm":
        return RecurrentRegressor("lstm", input_size, output_size, args.hidden_size, args.num_layers, args.dropout)
    if model_name == "gru":
        return RecurrentRegressor("gru", input_size, output_size, args.hidden_size, args.num_layers, args.dropout)
    if model_name == "bilstm":
        return RecurrentRegressor(
            "lstm", input_size, output_size, args.hidden_size, args.num_layers, args.dropout, bidirectional=True
        )
    if model_name == "hybrid":
        return HybridCNNLSTM(input_size, output_size, args.hidden_size, args.num_layers, args.dropout)
    if model_name in {"encoder_decoder", "seq2seq"}:
        return EncoderDecoderRegressor(input_size, output_size, args.hidden_size, args.num_layers, args.dropout)
    raise ValueError(f"Unsupported model: {model_name}")
